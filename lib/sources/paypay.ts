import * as cheerio from "cheerio";
import { cleanText, formatYen } from "@/lib/format";
import { dig, readNextData, str } from "@/lib/sources/next-data";
import { fetchHtml, statusFor } from "@/lib/sources/http";
import { prefectureFromEnum } from "@/lib/sources/prefectures";
import type { Source } from "@/lib/sources/types";
import type { ParseResult, ParsedListing, ParsedPhoto } from "@/lib/types";

const ID_RE = /paypayfleamarket\.yahoo\.co\.jp\/item\/(z\d+)(?![a-z0-9])/i;

export function paypayCanonical(id: string): string {
  return `https://paypayfleamarket.yahoo.co.jp/item/${id.toLowerCase()}`;
}

function base(partial: Partial<ParsedListing> & { rawId: string }): ParsedListing {
  const { rawId, ...rest } = partial;
  return {
    id: `pp_${rawId}`,
    source: "paypay",
    priceKind: "fixed",
    detailLevel: "full",
    sourceUrl: paypayCanonical(rawId),
    title: "",
    priceYen: null,
    priceLabel: "",
    bidCount: null,
    seller: "",
    sellerId: "",
    endTime: "",
    endTimeLabel: "",
    condition: "",
    prefecture: "",
    shipping: "",
    description: "",
    buyNowYen: null,
    photos: [],
    availability: "live",
    ...rest,
  };
}

export function parsePaypayHtml(html: string, canonicalUrl: string): ParseResult {
  if (!html || html.length < 40) return { status: "error", message: "ページの内容を読み取れませんでした。" };
  const rawId = (canonicalUrl.match(/\/item\/(z\d+)/i)?.[1] || "").toLowerCase();
  if (!rawId) return { status: "error", message: "出品情報を読み取れませんでした。" };

  const data = readNextData(html);
  const item = dig(data, "props", "initialState", "itemsState", "items", "item") as Record<string, unknown> | undefined;
  if (item && typeof item === "object" && str(item.title)) {
    const photos: ParsedPhoto[] = [];
    const seen = new Set<string>();
    for (const img of Array.isArray(item.images) ? (item.images as { url?: unknown }[]) : []) {
      const url = str(img?.url);
      if (url && !seen.has(url)) {
        seen.add(url);
        photos.push({ url, caption: "" });
      }
    }
    const price = typeof item.price === "number" && Number.isFinite(item.price) ? item.price : null;
    const sold = str(item.status).toUpperCase() === "SOLD";
    const method = str(dig(item, "deliveryMethod", "name"));
    const schedule = str(dig(item, "deliverySchedule", "text"));
    const listing = base({
      rawId,
      title: cleanText(str(item.title)),
      description: cleanText(str(item.description)),
      priceYen: price,
      priceLabel: price != null ? formatYen(price) : "",
      condition: cleanText(str(dig(item, "condition", "text"))),
      shipping: [method, schedule].map(cleanText).filter(Boolean).join(" · "),
      prefecture: prefectureFromEnum(item.location),
      seller: cleanText(str(dig(item, "seller", "nickname"))),
      sellerId: str(dig(item, "seller", "id")),
      postedAt: str(item.openDate),
      photos,
      availability: sold ? "ended" : "live",
    });
    return { status: sold ? "ended" : "ok", listing };
  }

  // フォールバック: JSON-LD / OGP
  const $ = cheerio.load(html);
  let ld: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).text());
      const arr = Array.isArray(j) ? j : [j];
      for (const o of arr) if (o && typeof o === "object" && (o["@type"] === "Product" || o.offers) && !ld) ld = o;
    } catch {
      /* ignore */
    }
  });
  const ldo = ld as Record<string, unknown> | null;
  const title = cleanText(
    str(ldo?.name) ||
      ($('meta[property="og:title"]').attr("content") || $("title").first().text() || "").replace(/\s*[-–|]\s*(PayPayフリマ|Yahoo!フリマ).*$/i, ""),
  );
  if (!title) return { status: "error", message: "PayPayフリマの出品ページとして読み取れませんでした。" };
  const priceRaw = Number(dig(ldo, "offers", "price"));
  const price = Number.isFinite(priceRaw) && priceRaw > 0 ? priceRaw : null;
  const ldImage = ldo?.image;
  const image = (Array.isArray(ldImage) ? str(ldImage[0]) : str(ldImage)) || $('meta[property="og:image"]').attr("content") || "";
  const soldOut = /SoldOut/i.test(str(dig(ldo, "offers", "availability")));
  const listing = base({
    rawId,
    title,
    description: cleanText(str(ldo?.description) || $('meta[property="og:description"]').attr("content") || ""),
    priceYen: price,
    priceLabel: price != null ? formatYen(price) : "",
    photos: image ? [{ url: image, caption: "" }] : [],
    availability: soldOut ? "ended" : "unknown",
    detailLevel: "partial",
  });
  return { status: soldOut ? "ended" : "ok", listing };
}

export const paypay: Source = {
  id: "paypay",
  label: "PayPayフリマ",
  allowedHosts: ["paypayfleamarket.yahoo.co.jp"],
  photoHosts: ["yimg.jp", "yahoo.co.jp"],
  priceLabelText: "価格",
  exampleUrl: "https://paypayfleamarket.yahoo.co.jp/item/z123456789",
  match(text) {
    const m = ID_RE.exec(text || "");
    if (!m) return null;
    return { id: `pp_${m[1].toLowerCase()}`, canonicalUrl: paypayCanonical(m[1]), index: m.index };
  },
  async fetch(canonicalUrl) {
    const res = await fetchHtml(canonicalUrl, this.allowedHosts);
    if (!res.ok) return { httpStatus: res.httpStatus, parsed: { status: "error", message: res.message } };
    const parsed = parsePaypayHtml(res.html, canonicalUrl);
    return { parsed, httpStatus: statusFor(parsed.status, res.status) };
  },
};
