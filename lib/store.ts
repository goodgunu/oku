import { randomBytes } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArchiveRecord, ParsedListing } from "@/lib/types";
import { getSource, isListingId } from "@/lib/sources";
import { LEGACY_FOLDER } from "@/lib/account";
import { priceHistoryAfter } from "@/lib/price-history";
import { isShareId, publicListingOf, type ShareRecord } from "@/lib/share";
import { archivePhotos, copyR2Object, deleteR2Prefix, getR2Json, getR2Object, isR2Enabled, listR2Keys, putR2Json, recordKey } from "@/lib/r2";

function dataDir(): string {
  return process.env.OKU_DATA_DIR || path.join(process.cwd(), ".data");
}

async function ensureDir(dir: string) {
  await mkdir(dir, { recursive: true });
}

async function readJsonFile<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function recordsDir(folder: string): string {
  return path.join(dataDir(), "records", folder);
}

function recordPath(folder: string, id: string): string {
  return path.join(recordsDir(folder), `${id.toLowerCase()}.json`);
}

let cachedSecret: string | null = null;

export async function authSecret(): Promise<string> {
  const env = process.env.AUTH_SECRET || process.env.CLERK_SECRET_KEY;
  if (env) return env;
  if (cachedSecret) return cachedSecret;
  const file = path.join(dataDir(), "secret");
  try {
    cachedSecret = (await readFile(file, "utf8")).trim();
    if (cachedSecret) return cachedSecret;
  } catch {
    // create below
  }
  await ensureDir(dataDir());
  cachedSecret = randomBytes(32).toString("hex");
  await writeFile(file, cachedSecret);
  return cachedSecret;
}

/** codes/ links/ など、アプリ用の小さなJSON（R2 または ./.data） */
export async function readAppJson<T>(key: string): Promise<T | null> {
  if (isR2Enabled()) return getR2Json<T>(key);
  return readJsonFile<T>(path.join(/*turbopackIgnore: true*/ dataDir(), key));
}

export async function writeAppJson(key: string, value: unknown): Promise<void> {
  if (isR2Enabled()) return putR2Json(key, value);
  const file = path.join(/*turbopackIgnore: true*/ dataDir(), key);
  await ensureDir(path.dirname(file));
  await writeFile(file, JSON.stringify(value, null, 2));
}

export async function deleteAppJson(key: string): Promise<void> {
  if (isR2Enabled()) {
    await deleteR2Prefix(key).catch(() => undefined);
    return;
  }
  const file = path.join(/*turbopackIgnore: true*/ dataDir(), key);
  await rm(file, { force: true }).catch(() => undefined);
}

export async function listLineLinkNames(): Promise<string[]> {
  if (isR2Enabled()) {
    const keys = await listR2Keys("links/");
    return keys
      .map((k) => k.slice("links/".length))
      .filter((name) => name.endsWith(".json"));
  }
  const names = await readdir(path.join(dataDir(), "links")).catch(() => []);
  return names.filter((n) => n.endsWith(".json"));
}

export async function listNotifyQueueFolders(): Promise<string[]> {
  if (isR2Enabled()) {
    const keys = await listR2Keys("notify/queue/");
    const set = new Set<string>();
    for (const k of keys) {
      const m = k.match(/^notify\/queue\/([^/]+)\//);
      if (m) set.add(m[1]);
    }
    return [...set];
  }
  const entries = await readdir(path.join(dataDir(), "notify", "queue"), { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => e.name);
}

/** 古い保存データ（source なし）を ヤフオク として扱えるようにそろえる */
export function normalizeRecord(r: ArchiveRecord): ArchiveRecord {
  return {
    ...r,
    source: r.source || "yahoo-auction",
    priceKind: r.priceKind || "current_bid",
    detailLevel: r.detailLevel || "full",
  };
}

export function listingToRecord(listing: ParsedListing, existing?: ArchiveRecord | null): ArchiveRecord {
  const now = new Date().toISOString();
  const priceHistory = priceHistoryAfter(existing, listing.priceLabel, listing.priceYen, now);
  return {
    id: listing.id,
    source: listing.source || "yahoo-auction",
    priceKind: listing.priceKind || "current_bid",
    detailLevel: listing.detailLevel || "full",
    sourceUrl: listing.sourceUrl,
    savedAt: existing?.savedAt || now,
    updatedAt: now,
    lastCheckedAt: now,
    availability: listing.availability,
    title: listing.title,
    priceYen: listing.priceYen,
    priceLabel: listing.priceLabel,
    priceHistory,
    bidCount: listing.bidCount,
    seller: listing.seller,
    sellerId: listing.sellerId,
    endTime: listing.endTime,
    endTimeLabel: listing.endTimeLabel,
    condition: listing.condition,
    prefecture: listing.prefecture,
    shipping: listing.shipping,
    description: listing.description,
    buyNowYen: listing.buyNowYen,
    photos: listing.photos,
    ...(listing.category ? { category: listing.category } : {}),
    ...(listing.postedAt ? { postedAt: listing.postedAt } : {}),
    memo: existing?.memo || "",
    ...(existing?.memoEntries ? { memoEntries: existing.memoEntries } : {}),
    ...(existing?.favorite ? { favorite: existing.favorite } : {}),
    watchStatus: existing?.watchStatus || "watching",
  };
}

export async function listRecords(folder: string): Promise<ArchiveRecord[]> {
  if (isR2Enabled()) {
    const keys = await listR2Keys(`records/${folder}/`);
    const all = await Promise.all(keys.filter((k) => k.endsWith(".json")).map((k) => getR2Json<ArchiveRecord>(k)));
    return all
      .filter((r): r is ArchiveRecord => Boolean(r?.id))
      .map(normalizeRecord)
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  }
  const dir = recordsDir(folder);
  const names = await readdir(dir).catch(() => []);
  const records: ArchiveRecord[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const record = await readJsonFile<ArchiveRecord>(path.join(dir, name));
    if (record?.id) records.push(normalizeRecord(record));
  }
  return records.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function getRecord(folder: string, id: string): Promise<ArchiveRecord | null> {
  if (!isListingId(id)) return null;
  const rec = isR2Enabled()
    ? await getR2Json<ArchiveRecord>(recordKey(folder, id))
    : await readJsonFile<ArchiveRecord>(recordPath(folder, id));
  return rec ? normalizeRecord(rec) : null;
}

export async function putRecord(folder: string, record: ArchiveRecord): Promise<void> {
  if (!isListingId(record.id)) throw new Error("出品IDが不正です。");
  if (isR2Enabled()) {
    await putR2Json(recordKey(folder, record.id), record);
    return;
  }
  await ensureDir(recordsDir(folder));
  await writeFile(recordPath(folder, record.id), JSON.stringify(record, null, 2));
}

export async function deleteRecord(folder: string, id: string): Promise<boolean> {
  if (!isListingId(id)) return false;
  if (isR2Enabled()) {
    try {
      await deleteR2Prefix(`photos/${folder}/${id.toLowerCase()}/`);
      await deleteR2Prefix(recordKey(folder, id));
      return true;
    } catch {
      return false;
    }
  }
  const file = recordPath(folder, id);
  try {
    await rm(file, { force: true });
    return true;
  } catch {
    return false;
  }
}

export async function saveListing(folder: string, listing: ParsedListing): Promise<ArchiveRecord> {
  const existing = await getRecord(folder, listing.id);
  const record = listingToRecord(listing, existing);
  if (isR2Enabled()) {
    record.photos = await archivePhotos(folder, listing.id, listing.photos, existing?.photos, getSource(listing.source).photoHosts);
  }
  await putRecord(folder, record);
  return record;
}

export type StoredRecordRef = {
  pathKey: string;
  record: ArchiveRecord;
};

export async function listAllStoredRecords(): Promise<StoredRecordRef[]> {
  if (isR2Enabled()) {
    const keys = (await listR2Keys("records/")).filter((k) => k.endsWith(".json"));
    const out: StoredRecordRef[] = [];
    for (const key of keys) {
      const record = await getR2Json<ArchiveRecord>(key);
      if (record?.id) out.push({ pathKey: key, record: normalizeRecord(record) });
    }
    return out;
  }
  const root = path.join(dataDir(), "records");
  const out: StoredRecordRef[] = [];
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const sub = path.join(root, entry.name);
    const files = await readdir(sub).catch(() => []);
    for (const file of files) {
      if (!file.endsWith(".json")) continue;
      const full = path.join(sub, file);
      const record = await readJsonFile<ArchiveRecord>(full);
      if (record?.id) out.push({ pathKey: `records/${entry.name}/${file}`, record: normalizeRecord(record) });
    }
  }
  return out;
}

export async function writeStoredRecord(pathKey: string, record: ArchiveRecord): Promise<void> {
  if (isR2Enabled()) {
    await putR2Json(pathKey, record);
    return;
  }
  const file = path.join(/*turbopackIgnore: true*/ dataDir(), pathKey);
  await ensureDir(path.dirname(file));
  await writeFile(file, JSON.stringify(record, null, 2));
}

// --- 共有ページ (/s/[sid]) ---
type SharePointer = { shareId: string };

function shareKey(shareId: string): string {
  return `shares/${shareId}.json`;
}

function shareByListingKey(folder: string, listingId: string): string {
  return `share-by-listing/${folder}/${listingId.toLowerCase()}.json`;
}

export async function publishShare(folder: string, record: ArchiveRecord, coverIndex = 0): Promise<ShareRecord> {
  const ptrKey = shareByListingKey(folder, record.id);
  const existingPtr = await readAppJson<SharePointer>(ptrKey);
  const existing =
    existingPtr?.shareId && isShareId(existingPtr.shareId)
      ? await readAppJson<ShareRecord>(shareKey(existingPtr.shareId))
      : null;
  const shareId = existing?.id || randomBytes(16).toString("base64url");
  const share: ShareRecord = {
    id: shareId,
    folder,
    listingId: record.id,
    createdAt: existing?.createdAt || new Date().toISOString(),
    listing: publicListingOf(record, coverIndex),
  };
  await writeAppJson(shareKey(shareId), share);
  await writeAppJson(ptrKey, { shareId });
  return share;
}

export async function getShare(shareId: string): Promise<ShareRecord | null> {
  if (!isShareId(shareId)) return null;
  return readAppJson<ShareRecord>(shareKey(shareId));
}

export async function getShareIdFor(folder: string, listingId: string): Promise<string | null> {
  if (!isListingId(listingId)) return null;
  const ptr = await readAppJson<SharePointer>(shareByListingKey(folder, listingId));
  return ptr?.shareId && isShareId(ptr.shareId) ? ptr.shareId : null;
}

export async function unpublishShare(folder: string, listingId: string): Promise<void> {
  if (!isListingId(listingId)) return;
  const ptrKey = shareByListingKey(folder, listingId);
  const ptr = await readAppJson<SharePointer>(ptrKey);
  if (ptr?.shareId && isShareId(ptr.shareId)) {
    await deleteAppJson(shareKey(ptr.shareId));
  }
  await deleteAppJson(ptrKey);
}

export async function getSharePhoto(shareId: string, index: number) {
  const share = await getShare(shareId);
  if (!share || !Number.isInteger(index) || index < 0 || index >= share.listing.photoCount) return null;
  const record = await getRecord(share.folder, share.listingId);
  const photo = record?.photos?.[index];
  if (!photo) return null;
  if (photo.key && isR2Enabled()) {
    return getR2Object(photo.key);
  }
  if (photo.url && /^https?:\/\//.test(photo.url)) {
    try {
      const res = await fetch(photo.url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok || !res.body) return null;
      return {
        body: res.body,
        contentType: res.headers.get("content-type") || "image/jpeg",
        length: Number(res.headers.get("content-length") || 0) || undefined,
      };
    } catch {
      return null;
    }
  }
  return null;
}

type AdoptMarker = { folder: string; at: string };

/**
 * 最初にログインした人に、ログイン導入前の records/me/ を引き継ぐ（1回だけ）。
 * 写真も photos/<id>/ から photos/<folder>/<id>/ へ移す。
 */
export async function adoptLegacyLibrary(folder: string): Promise<void> {
  if (folder === LEGACY_FOLDER) return;
  const marker = await readAppJson<AdoptMarker>("legacy-adopted.json");
  if (marker?.folder) return;
  await writeAppJson("legacy-adopted.json", { folder, at: new Date().toISOString() } satisfies AdoptMarker);

  if (isR2Enabled()) {
    const keys = (await listR2Keys(`records/${LEGACY_FOLDER}/`)).filter((k) => k.endsWith(".json"));
    for (const key of keys) {
      const record = await getR2Json<ArchiveRecord>(key);
      if (!record?.id || !isListingId(record.id)) continue;
      const photos = [];
      for (const photo of record.photos ?? []) {
        if (photo.key && photo.key.startsWith(`photos/${record.id.toLowerCase()}/`)) {
          const next = `photos/${folder}/${photo.key.slice("photos/".length)}`;
          if (await copyR2Object(photo.key, next)) {
            photos.push({ ...photo, key: next });
            continue;
          }
        }
        photos.push(photo);
      }
      await putR2Json(recordKey(folder, record.id), { ...record, photos });
      await deleteR2Prefix(`photos/${record.id.toLowerCase()}/`).catch(() => undefined);
      await deleteR2Prefix(key).catch(() => undefined);
    }
    return;
  }
  const from = recordsDir(LEGACY_FOLDER);
  const names = await readdir(from).catch(() => []);
  if (names.length === 0) return;
  await ensureDir(recordsDir(folder));
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const record = await readJsonFile<ArchiveRecord>(path.join(from, name));
    if (!record?.id) continue;
    await writeFile(path.join(recordsDir(folder), name), JSON.stringify(record, null, 2));
    await rm(path.join(from, name), { force: true });
  }
}
