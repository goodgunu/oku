import { formatYen } from "@/lib/format";
import type { ArchiveRecord, PricePoint } from "@/lib/types";

const MAX_POINTS = 90;
const DAY_MS = 24 * 60 * 60 * 1000;

function hasPrice(priceLabel: string, priceYen: number | null): boolean {
  return Boolean((priceLabel && priceLabel !== "—") || priceYen != null);
}

function seedFromRecord(existing?: ArchiveRecord | null): PricePoint[] {
  if (!existing) return [];
  if (existing.priceHistory?.length) return existing.priceHistory.slice(-MAX_POINTS);
  if (!hasPrice(existing.priceLabel, existing.priceYen)) return [];
  return [
    {
      at: existing.savedAt || existing.updatedAt,
      priceLabel: existing.priceLabel,
      priceYen: existing.priceYen,
    },
  ];
}

export function priceHistoryAfter(
  existing: ArchiveRecord | null | undefined,
  priceLabel: string,
  priceYen: number | null,
  now: string,
): PricePoint[] {
  const history = seedFromRecord(existing);
  if (!hasPrice(priceLabel, priceYen)) return history;
  const last = history[history.length - 1];
  if (last && last.priceLabel === priceLabel && last.priceYen === priceYen) {
    return history;
  }
  return [...history, { at: now, priceLabel, priceYen }].slice(-MAX_POINTS);
}

export type PriceChange = {
  direction: "down" | "up";
  deltaYen: number;
  deltaText: string;
  fromText: string;
  toText: string;
};

export function priceChange(record: Pick<ArchiveRecord, "priceHistory" | "priceLabel" | "priceYen">): PriceChange | null {
  const points = (record.priceHistory ?? []).filter((p) => p.priceYen != null);
  if (points.length < 2) return null;
  const first = points[0];
  const last = points[points.length - 1];
  if (first.priceYen == null || last.priceYen == null) return null;
  const delta = last.priceYen - first.priceYen;
  if (delta === 0) return null;
  const direction = delta < 0 ? "down" : "up";
  const abs = Math.abs(delta);
  return {
    direction,
    deltaYen: delta,
    deltaText: `${abs.toLocaleString("ja-JP")}円${direction === "down" ? "値下げ" : "値上げ"}`,
    fromText: first.priceLabel || formatYen(first.priceYen),
    toText: last.priceLabel || formatYen(last.priceYen),
  };
}

export function checkDue(record: Pick<ArchiveRecord, "availability" | "lastCheckedAt" | "checkAttemptAt">, nowMs = Date.now()): boolean {
  if (record.availability === "ended") return false;
  const stamp = record.checkAttemptAt || record.lastCheckedAt;
  if (!stamp) return true;
  const lastMs = Date.parse(stamp);
  if (Number.isNaN(lastMs)) return true;
  return nowMs - lastMs >= 20 * 60 * 60 * 1000 && nowMs - lastMs <= 365 * DAY_MS;
}
