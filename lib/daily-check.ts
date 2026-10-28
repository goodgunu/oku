import { detectEvents, queueEventsForPath, sendDigests, type DigestReport } from "@/lib/notify";
import { checkDue, priceHistoryAfter } from "@/lib/price-history";
import { fetchListing } from "@/lib/sources";
import { listAllStoredRecords, writeStoredRecord } from "@/lib/store";
import type { ArchiveRecord } from "@/lib/types";

const DEFAULT_LIMIT = 20;

export async function refreshStoredListing(record: ArchiveRecord, nowIso = new Date().toISOString()): Promise<ArchiveRecord> {
  if (!record.sourceUrl || !/^https?:\/\//i.test(record.sourceUrl)) {
    return record;
  }
  try {
    const { parsed } = await fetchListing(record.sourceUrl);
    if (parsed.status === "error") {
      return {
        ...record,
        checkAttemptAt: nowIso,
      };
    }
    const listing = parsed.listing;
    const priceLabel = listing.priceLabel && listing.priceLabel !== "—" ? listing.priceLabel : record.priceLabel;
    const priceYen = listing.priceYen ?? record.priceYen;
    const priceHistory = priceHistoryAfter(record, priceLabel, priceYen, nowIso);
    return {
      ...record,
      updatedAt: nowIso,
      lastCheckedAt: nowIso,
      checkAttemptAt: nowIso,
      availability: listing.availability,
      priceLabel,
      priceYen,
      priceHistory,
      bidCount: listing.bidCount ?? record.bidCount,
      buyNowYen: listing.buyNowYen ?? record.buyNowYen,
      endTime: listing.endTime || record.endTime,
      endTimeLabel: listing.endTimeLabel || record.endTimeLabel,
    };
  } catch {
    return {
      ...record,
      checkAttemptAt: nowIso,
    };
  }
}

export type DailyCheckReport = {
  scanned: number;
  checked: number;
  priceChanged: number;
  endedDetected: number;
  failed: number;
  digest?: DigestReport;
};

export async function runDailyCheck(limit = DEFAULT_LIMIT, opts?: { baseUrl?: string }): Promise<DailyCheckReport> {
  const all = await listAllStoredRecords();
  const nowMs = Date.now();
  const due = all
    .filter(({ record }) => checkDue(record, nowMs))
    .sort((a, b) => {
      const ta = Date.parse(a.record.checkAttemptAt || a.record.lastCheckedAt || a.record.savedAt || "1970-01-01");
      const tb = Date.parse(b.record.checkAttemptAt || b.record.lastCheckedAt || b.record.savedAt || "1970-01-01");
      return ta - tb;
    })
    .slice(0, limit);

  let priceChanged = 0;
  let endedDetected = 0;
  let failed = 0;

  for (const item of due) {
    const before = item.record;
    const nowIso = new Date().toISOString();
    const after = await refreshStoredListing(before, nowIso);
    if (after.lastCheckedAt !== nowIso) {
      failed += 1;
    } else {
      if ((after.priceHistory?.length ?? 0) > (before.priceHistory?.length ?? 0)) priceChanged += 1;
      if (before.availability !== "ended" && after.availability === "ended") endedDetected += 1;
      const events = detectEvents(before, after, nowIso);
      if (events.length > 0) await queueEventsForPath(item.pathKey, events);
    }
    await writeStoredRecord(item.pathKey, after);
  }

  const baseUrl =
    opts?.baseUrl ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "https://oku-bice.vercel.app");
  const digest = await sendDigests({ baseUrl });

  return {
    scanned: all.length,
    checked: due.length,
    priceChanged,
    endedDetected,
    failed,
    digest,
  };
}
