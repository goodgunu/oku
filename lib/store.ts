import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArchiveRecord, ParsedListing } from "@/lib/types";
import { isYahooListingId } from "@/lib/yahoo-url";
import { LEGACY_FOLDER } from "@/lib/account";
import { archivePhotos, copyR2Object, deleteR2Prefix, getR2Json, isR2Enabled, listR2Keys, putR2Json, recordKey } from "@/lib/r2";

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

export function listingToRecord(listing: ParsedListing, existing?: ArchiveRecord | null): ArchiveRecord {
  const now = new Date().toISOString();
  return {
    id: listing.id,
    sourceUrl: listing.sourceUrl,
    savedAt: existing?.savedAt || now,
    updatedAt: now,
    availability: listing.availability,
    title: listing.title,
    priceYen: listing.priceYen,
    priceLabel: listing.priceLabel,
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
    memo: existing?.memo || "",
  };
}

export async function listRecords(folder: string): Promise<ArchiveRecord[]> {
  if (isR2Enabled()) {
    const keys = await listR2Keys(`records/${folder}/`);
    const all = await Promise.all(keys.filter((k) => k.endsWith(".json")).map((k) => getR2Json<ArchiveRecord>(k)));
    return all
      .filter((r): r is ArchiveRecord => Boolean(r?.id))
      .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
  }
  const dir = recordsDir(folder);
  const names = await readdir(dir).catch(() => []);
  const records: ArchiveRecord[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const record = await readJsonFile<ArchiveRecord>(path.join(dir, name));
    if (record?.id) records.push(record);
  }
  return records.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function getRecord(folder: string, id: string): Promise<ArchiveRecord | null> {
  if (!isYahooListingId(id)) return null;
  if (isR2Enabled()) return getR2Json<ArchiveRecord>(recordKey(folder, id));
  return readJsonFile<ArchiveRecord>(recordPath(folder, id));
}

export async function putRecord(folder: string, record: ArchiveRecord): Promise<void> {
  if (!isYahooListingId(record.id)) throw new Error("出品IDが不正です。");
  if (isR2Enabled()) {
    await putR2Json(recordKey(folder, record.id), record);
    return;
  }
  await ensureDir(recordsDir(folder));
  await writeFile(recordPath(folder, record.id), JSON.stringify(record, null, 2));
}

export async function deleteRecord(folder: string, id: string): Promise<boolean> {
  if (!isYahooListingId(id)) return false;
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
    record.photos = await archivePhotos(folder, listing.id, listing.photos, existing?.photos);
  }
  await putRecord(folder, record);
  return record;
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
  // 先にマーカーを書いて二重実行を避ける
  await writeAppJson("legacy-adopted.json", { folder, at: new Date().toISOString() } satisfies AdoptMarker);

  if (isR2Enabled()) {
    const keys = (await listR2Keys(`records/${LEGACY_FOLDER}/`)).filter((k) => k.endsWith(".json"));
    for (const key of keys) {
      const record = await getR2Json<ArchiveRecord>(key);
      if (!record?.id || !isYahooListingId(record.id)) continue;
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
