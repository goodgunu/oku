import { formatYen } from "@/lib/format";
import { linkedLineUserId } from "@/lib/line-link";
import { type LineLink } from "@/lib/line-link";
import { deleteAppJson, listLineLinkNames, listNotifyQueueFolders, readAppJson, writeAppJson } from "@/lib/store";
import type { ArchiveRecord } from "@/lib/types";
import { normalizeAccountKey, safeLineUserId, userFolder } from "@/lib/account";

export type NotifyEvent =
  | {
      kind: "drop";
      listingId: string;
      name: string;
      fromPrice: string;
      toPrice: string;
      deltaText: string;
      at: string;
    }
  | {
      kind: "ended";
      listingId: string;
      name: string;
      price: string;
      at: string;
    };

export type NotifySettings = {
  enabled: boolean;
  updatedAt: string;
};

type QueueDoc = {
  folder: string;
  events: NotifyEvent[];
};

const MAX_LINES_PER_GROUP = 10;

export function listingShortName(record: Pick<ArchiveRecord, "title">): string {
  const base = (record.title || "").replace(/\s+/g, " ").trim() || "出品";
  return base.length > 36 ? `${base.slice(0, 35)}…` : base;
}

function priceDisplay(record: Pick<ArchiveRecord, "priceLabel" | "priceYen">): string {
  if (record.priceLabel && record.priceLabel !== "—") return record.priceLabel;
  if (record.priceYen != null) return formatYen(record.priceYen);
  return "";
}

export function detectEvents(before: ArchiveRecord, after: ArchiveRecord, nowIso = new Date().toISOString()): NotifyEvent[] {
  const name = listingShortName(after);
  if (before.availability !== "ended" && after.availability === "ended") {
    return [
      {
        kind: "ended",
        listingId: after.id,
        name,
        price: priceDisplay(after) || priceDisplay(before),
        at: nowIso,
      },
    ];
  }
  if (before.priceYen != null && after.priceYen != null && after.priceYen < before.priceYen) {
    const drop = before.priceYen - after.priceYen;
    return [
      {
        kind: "drop",
        listingId: after.id,
        name,
        fromPrice: priceDisplay(before),
        toPrice: priceDisplay(after),
        deltaText: `${drop.toLocaleString("ja-JP")}円値下げ`,
        at: nowIso,
      },
    ];
  }
  return [];
}

export function mergeEvents(existing: NotifyEvent[], incoming: NotifyEvent[]): NotifyEvent[] {
  const byKey = new Map<string, NotifyEvent>();
  for (const ev of existing) byKey.set(`${ev.kind}:${ev.listingId}`, ev);
  for (const ev of incoming) {
    const key = `${ev.kind}:${ev.listingId}`;
    const prev = byKey.get(key);
    if (prev && prev.kind === "drop" && ev.kind === "drop") {
      byKey.set(key, { ...ev, fromPrice: prev.fromPrice });
    } else {
      byKey.set(key, ev);
    }
    if (ev.kind === "ended") byKey.delete(`drop:${ev.listingId}`);
  }
  return [...byKey.values()];
}

function jstDateParts(now = new Date()): { dateKey: string; label: string } {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = jst.getUTCFullYear();
  const m = jst.getUTCMonth() + 1;
  const d = jst.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { dateKey: `${y}-${pad(m)}-${pad(d)}`, label: `${m}月${d}日` };
}

export function digestText(events: NotifyEvent[], baseUrl: string, now = new Date()): string | null {
  if (events.length === 0) return null;
  const { label } = jstDateParts(now);
  const drops = events.filter((e): e is Extract<NotifyEvent, { kind: "drop" }> => e.kind === "drop");
  const ended = events.filter((e): e is Extract<NotifyEvent, { kind: "ended" }> => e.kind === "ended");
  const lines: string[] = [`おくからのお知らせ（${label}）`];

  if (drops.length > 0) {
    lines.push("", `【値下げ】${drops.length}件`);
    for (const ev of drops.slice(0, MAX_LINES_PER_GROUP)) {
      lines.push(`・${ev.name}`, `　${ev.fromPrice} → ${ev.toPrice}（${ev.deltaText}）`);
    }
    if (drops.length > MAX_LINES_PER_GROUP) lines.push(`　ほか${drops.length - MAX_LINES_PER_GROUP}件`);
  }

  if (ended.length > 0) {
    lines.push("", `【終了】${ended.length}件`);
    for (const ev of ended.slice(0, MAX_LINES_PER_GROUP)) {
      lines.push(`・${ev.name}${ev.price ? `（${ev.price}）` : ""}`);
    }
    if (ended.length > MAX_LINES_PER_GROUP) lines.push(`　ほか${ended.length - MAX_LINES_PER_GROUP}件`);
  }

  const cleanBase = baseUrl.replace(/\/$/, "");
  lines.push("", `保存した出品を見る`, `${cleanBase}/`);
  return lines.join("\n");
}

function settingsKey(folder: string): string {
  return `notify/settings/${folder}.json`;
}

function queueKey(folder: string, dateKey: string): string {
  return `notify/queue/${folder}/${dateKey}.json`;
}

export function folderFromRecordPath(pathKey: string): string | null {
  const m = pathKey.match(/^records\/([^/]+)\/[^/]+\.json$/);
  if (!m) return null;
  return m[1] === "me" ? null : m[1];
}

export async function getNotifySettings(folder: string): Promise<NotifySettings> {
  const saved = await readAppJson<NotifySettings>(settingsKey(folder));
  if (saved && typeof saved.enabled === "boolean") return saved;
  return { enabled: true, updatedAt: "" };
}

export async function putNotifySettings(folder: string, enabled: boolean): Promise<NotifySettings> {
  const next: NotifySettings = { enabled, updatedAt: new Date().toISOString() };
  await writeAppJson(settingsKey(folder), next);
  return next;
}

export async function settingsForEmail(accountKey: string): Promise<{ enabled: boolean; lineLinked: boolean }> {
  const normalized = normalizeAccountKey(accountKey);
  if (!normalized) return { enabled: false, lineLinked: false };
  const folder = userFolder(normalized);
  const [settings, lineUserId] = await Promise.all([getNotifySettings(folder), linkedLineUserId(normalized)]);
  return { enabled: settings.enabled, lineLinked: Boolean(lineUserId) };
}

export async function queueEventsForPath(pathKey: string, events: NotifyEvent[], now = new Date()): Promise<void> {
  if (events.length === 0) return;
  const folder = folderFromRecordPath(pathKey);
  if (!folder) return;
  const { dateKey } = jstDateParts(now);
  const key = queueKey(folder, dateKey);
  const current = await readAppJson<QueueDoc>(key);
  const merged = mergeEvents(current?.events ?? [], events);
  await writeAppJson(key, { folder, events: merged });
}

export async function linkedRecipients(): Promise<Map<string, string>> {
  const names = await listLineLinkNames();
  const newest = new Map<string, { lineUserId: string; linkedAt: string }>();
  for (const name of names) {
    const rec = await readAppJson<LineLink>(`links/${name}`);
    if (!rec) continue;
    const account = normalizeAccountKey(rec.email);
    if (!account || !safeLineUserId(rec.lineUserId)) continue;
    const folder = userFolder(account);
    const prev = newest.get(folder);
    if (!prev || rec.linkedAt > prev.linkedAt) {
      newest.set(folder, { lineUserId: rec.lineUserId, linkedAt: rec.linkedAt });
    }
  }
  const map = new Map<string, string>();
  for (const [folder, v] of newest) map.set(folder, v.lineUserId);
  return map;
}

export type DigestReport = {
  sent: number;
  skippedDisabled: number;
  skippedUnlinked: number;
  failed: number;
};

export async function sendDigests(opts: {
  baseUrl: string;
  now?: Date;
  push?: (lineUserId: string, text: string) => Promise<boolean>;
}): Promise<DigestReport> {
  const now = opts.now ?? new Date();
  const { dateKey } = jstDateParts(now);
  const push = opts.push ?? defaultLinePush;
  const [folders, recipients] = await Promise.all([listNotifyQueueFolders(), linkedRecipients()]);
  const report: DigestReport = { sent: 0, skippedDisabled: 0, skippedUnlinked: 0, failed: 0 };

  for (const folder of folders) {
    const key = queueKey(folder, dateKey);
    const doc = await readAppJson<QueueDoc>(key);
    if (!doc || !doc.events?.length) continue;

    const settings = await getNotifySettings(folder);
    if (!settings.enabled) {
      await deleteAppJson(key);
      report.skippedDisabled += 1;
      continue;
    }
    const lineUserId = recipients.get(folder);
    if (!lineUserId) {
      await deleteAppJson(key);
      report.skippedUnlinked += 1;
      continue;
    }
    const text = digestText(doc.events, opts.baseUrl, now);
    if (!text) {
      await deleteAppJson(key);
      continue;
    }
    const ok = await push(lineUserId, text);
    if (ok) {
      await deleteAppJson(key);
      report.sent += 1;
    } else {
      report.failed += 1;
    }
  }
  return report;
}

async function defaultLinePush(lineUserId: string, text: string): Promise<boolean> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  if (!token) return false;
  try {
    const res = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text }],
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
