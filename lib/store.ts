import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ArchiveRecord, ParsedListing } from "@/lib/types";
import { isYahooListingId } from "@/lib/yahoo-url";

const OWNER = "me";

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

function recordsDir(): string {
  return path.join(dataDir(), "records", OWNER);
}

function recordPath(id: string): string {
  return path.join(recordsDir(), `${id.toLowerCase()}.json`);
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
    description: listing.description,
    buyNowYen: listing.buyNowYen,
    photos: listing.photos,
    memo: existing?.memo || "",
  };
}

export async function listRecords(): Promise<ArchiveRecord[]> {
  const dir = recordsDir();
  const names = await readdir(dir).catch(() => []);
  const records: ArchiveRecord[] = [];
  for (const name of names) {
    if (!name.endsWith(".json")) continue;
    const record = await readJsonFile<ArchiveRecord>(path.join(dir, name));
    if (record?.id) records.push(record);
  }
  return records.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1));
}

export async function getRecord(id: string): Promise<ArchiveRecord | null> {
  if (!isYahooListingId(id)) return null;
  return readJsonFile<ArchiveRecord>(recordPath(id));
}

export async function putRecord(record: ArchiveRecord): Promise<void> {
  if (!isYahooListingId(record.id)) throw new Error("出品IDが不正です。");
  await ensureDir(recordsDir());
  await writeFile(recordPath(record.id), JSON.stringify(record, null, 2));
}

export async function deleteRecord(id: string): Promise<boolean> {
  if (!isYahooListingId(id)) return false;
  const file = recordPath(id);
  try {
    await rm(file, { force: true });
    return true;
  } catch {
    return false;
  }
}

export async function saveListing(listing: ParsedListing): Promise<ArchiveRecord> {
  const existing = await getRecord(listing.id);
  const record = listingToRecord(listing, existing);
  await putRecord(record);
  return record;
}
