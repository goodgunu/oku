export type ParsedPhoto = {
  url: string;
  caption: string;
  /** R2 に保存した写真のキー（保存済みのときだけ） */
  key?: string;
};

export type SourceId = "yahoo-auction" | "paypay" | "jmty" | "mercari";
export type PriceKind = "fixed" | "current_bid" | "free";
export type DetailLevel = "full" | "partial";

export type ParsedListing = {
  id: string;
  /** どのサイトか。古い保存データには無い（yahoo-auction 扱い） */
  source?: SourceId;
  priceKind?: PriceKind;
  detailLevel?: DetailLevel;
  sourceUrl: string;
  title: string;
  priceYen: number | null;
  priceLabel: string;
  bidCount: number | null;
  seller: string;
  sellerId: string;
  endTime: string;
  endTimeLabel: string;
  condition: string;
  prefecture: string;
  shipping: string;
  description: string;
  buyNowYen: number | null;
  photos: ParsedPhoto[];
  availability: Availability;
  /** カテゴリ（ジモティーなど） */
  category?: string;
  /** 掲載日時（ISO） */
  postedAt?: string;
};

export type Availability = "live" | "ended" | "unknown";

export type ArchiveRecord = {
  id: string;
  source: SourceId;
  priceKind: PriceKind;
  detailLevel: DetailLevel;
  sourceUrl: string;
  savedAt: string;
  updatedAt: string;
  availability: Availability;
  title: string;
  priceYen: number | null;
  priceLabel: string;
  bidCount: number | null;
  seller: string;
  sellerId: string;
  endTime: string;
  endTimeLabel: string;
  condition: string;
  prefecture: string;
  shipping: string;
  description: string;
  buyNowYen: number | null;
  photos: ParsedPhoto[];
  category?: string;
  postedAt?: string;
  memo: string;
};

export type ParseResult =
  | { status: "ok"; listing: ParsedListing }
  | { status: "ended"; listing: ParsedListing }
  | { status: "error"; message: string };
