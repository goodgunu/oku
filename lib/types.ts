export type ParsedPhoto = {
  url: string;
  caption: string;
};

export type ParsedListing = {
  id: string;
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
  description: string;
  buyNowYen: number | null;
  photos: ParsedPhoto[];
  availability: Availability;
};

export type Availability = "live" | "ended" | "unknown";

export type ArchiveRecord = {
  id: string;
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
  description: string;
  buyNowYen: number | null;
  photos: ParsedPhoto[];
  memo: string;
};

export type ParseResult =
  | { status: "ok"; listing: ParsedListing }
  | { status: "ended"; listing: ParsedListing }
  | { status: "error"; message: string };
