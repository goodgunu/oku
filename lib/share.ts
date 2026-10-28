import { formatYen } from "@/lib/format";
import { sourceLabel } from "@/lib/source-labels";
import type { ArchiveRecord, Availability, SourceId } from "@/lib/types";

export type PublicListing = {
  name: string;
  source: SourceId;
  sourceLabel: string;
  priceLabel: string;
  price: string;
  buyNow?: string;
  bidCount?: number | null;
  condition?: string;
  shipping?: string;
  prefecture?: string;
  category?: string;
  endTimeLabel?: string;
  description?: string;
  availability: Availability;
  sourceUrl: string;
  photoCount: number;
  coverIndex: number;
  sharedAt: string;
};

export type ShareRecord = {
  id: string;
  folder: string;
  listingId: string;
  createdAt: string;
  listing: PublicListing;
};

const SHARE_ID_RE = /^[A-Za-z0-9_-]{22}$/;

export function isShareId(id: string): boolean {
  return SHARE_ID_RE.test(id);
}

const NAME_LIMIT = 48;

export function shareTitle(record: Pick<ArchiveRecord, "title">): string {
  const base = (record.title || "").replace(/\s+/g, " ").trim();
  return base.length > NAME_LIMIT ? `${base.slice(0, NAME_LIMIT - 1)}…` : base;
}

export function publicListingOf(record: ArchiveRecord, coverIndex = 0, now = new Date()): PublicListing {
  const count = record.photos?.length ?? 0;
  const priceName =
    record.priceKind === "current_bid" || (!record.priceKind && record.source === "yahoo-auction")
      ? "現在価格"
      : "価格";
  const priceVal =
    record.priceLabel && record.priceLabel !== "—"
      ? record.priceLabel
      : record.priceYen != null
        ? formatYen(record.priceYen)
        : "";
  return {
    name: shareTitle(record),
    source: record.source || "yahoo-auction",
    sourceLabel: sourceLabel(record.source),
    priceLabel: priceName,
    price: priceVal,
    buyNow: record.buyNowYen != null ? formatYen(record.buyNowYen) : "",
    bidCount: record.bidCount,
    condition: record.condition || "",
    shipping: record.shipping || "",
    prefecture: record.prefecture || "",
    category: record.category || "",
    endTimeLabel: record.endTimeLabel || "",
    description: (record.description || "").slice(0, 2000),
    availability: record.availability,
    sourceUrl: record.sourceUrl,
    photoCount: count,
    coverIndex: coverIndex >= 0 && coverIndex < count ? coverIndex : 0,
    sharedAt: now.toISOString(),
  };
}

export function postBody(comment: string, listing: Pick<PublicListing, "name" | "sourceLabel" | "priceLabel" | "price">): string {
  const lines = [listing.name];
  if (listing.price) lines.push(`${listing.priceLabel} ${listing.price}（${listing.sourceLabel}）`);
  const note = comment.trim();
  return note ? `${note}\n\n${lines.join("\n")}` : lines.join("\n");
}

export function postText(comment: string, listing: Pick<PublicListing, "name" | "sourceLabel" | "priceLabel" | "price">, url: string): string {
  return `${postBody(comment, listing)}\n${url}`;
}

export const X_LIMIT = 280;
const URL_WEIGHT = 23;

function charWeight(code: number): number {
  if (
    (code >= 0 && code <= 4351) ||
    (code >= 8192 && code <= 8205) ||
    (code >= 8208 && code <= 8223) ||
    (code >= 8242 && code <= 8247)
  ) {
    return 1;
  }
  return 2;
}

export function weightedLength(bodyWithoutUrl: string, hasUrl = true): number {
  let total = 0;
  for (const ch of bodyWithoutUrl) total += charWeight(ch.codePointAt(0) ?? 0);
  return total + (hasUrl ? 1 + URL_WEIGHT : 0);
}

export const COMMENT_LIMIT = 50;
export const PHOTO_LIMIT = 4;

export function intentUrl(comment: string, listing: Pick<PublicListing, "name" | "sourceLabel" | "priceLabel" | "price">, url: string): string {
  const params = new URLSearchParams({ text: postBody(comment, listing), url });
  return `https://x.com/intent/post?${params.toString().replace(/\+/g, "%20")}`;
}

export function togglePhoto(selected: number[], index: number, limit = PHOTO_LIMIT): number[] {
  if (selected.includes(index)) return selected.filter((item) => item !== index);
  const next = [...selected, index];
  return next.length > limit ? next.slice(next.length - limit) : next;
}
