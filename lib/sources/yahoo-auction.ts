import { parseYahooHtml } from "@/lib/parse-yahoo";
import { canonicalYahooUrl } from "@/lib/yahoo-url";
import { fetchHtml, statusFor } from "@/lib/sources/http";
import type { Source } from "@/lib/sources/types";

export const yahooAuction: Source = {
  id: "yahoo-auction",
  label: "ヤフオク",
  allowedHosts: ["auctions.yahoo.co.jp"],
  photoHosts: ["yimg.jp", "yahoo.co.jp"],
  priceLabelText: "現在価格",
  exampleUrl: "https://auctions.yahoo.co.jp/jp/auction/h1234567890",
  match(text) {
    const c = canonicalYahooUrl(text);
    if (!c) return null;
    const idx = text.search(/auctions?\.yahoo\.co\.jp|aID=/i);
    return { id: c.id, canonicalUrl: c.url, index: idx >= 0 ? idx : 1e9 };
  },
  async fetch(canonicalUrl) {
    const res = await fetchHtml(canonicalUrl, this.allowedHosts);
    if (!res.ok) return { httpStatus: res.httpStatus, parsed: { status: "error", message: res.message } };
    const parsed = parseYahooHtml(res.html, canonicalUrl);
    if (parsed.status !== "error") {
      parsed.listing.source = "yahoo-auction";
      parsed.listing.priceKind = "current_bid";
      parsed.listing.detailLevel = "full";
    }
    return { parsed, httpStatus: statusFor(parsed.status, res.status) };
  },
};
