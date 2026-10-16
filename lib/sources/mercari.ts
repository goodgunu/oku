import * as cheerio from "cheerio";
import { cleanText } from "@/lib/format";
import { fetchHtml, statusFor, USER_AGENT } from "@/lib/sources/http";
import type { Source } from "@/lib/sources/types";
import type { ParseResult, ParsedListing, ParsedPhoto } from "@/lib/types";

const URL_RE =
  /(?:^|[^a-z0-9.])(?:jp\.mercari\.com\/(?:jp\/)?items?|(?:www\.)?mercari\.com\/jp\/items?)\/(m\d+)(?![a-z0-9])/i;
const MAX_PHOTOS = 10;

export function mercariCanonical(id: string): string {
  return `https://jp.mercari.com/item/${id.toLowerCase()}`;
}

/** タイトルから ' by メルカリ' / ' - メルカリ' を外す */
export function cleanMercariTitle(raw: string): string {
  return cleanText(raw)
    .replace(/\s+by\s+メルカリ\s*$/i, "")
    .replace(/\s*[-–|]\s*メルカリ\s*$/i, "")
    .trim();
}

export const MERCARI_NOTE = "メルカリは詳細を取得できないため、タイトルと写真のみ保存しています";

/** 軽量モード: タイトルと最初の写真だけ。写真の追加分は呼び出し側が探す。 */
export function parseMercariHtml(html: string, canonicalUrl: string): ParseResult {
  if (!html || html.length < 40) return { status: "error", message: "ページの内容を読み取れませんでした。" };
  const rawId = (canonicalUrl.match(/\/item\/(m\d+)/i)?.[1] || "").toLowerCase();
  if (!rawId) return { status: "error", message: "出品情報を読み取れませんでした。" };
  const $ = cheerio.load(html);
  const og = $('meta[property="og:title"]').attr("content") || "";
  const title = cleanMercariTitle(og || $("title").first().text() || "");
  if (!og && !/\s-\s*メルカリ\s*$/.test($("title").first().text())) {
    return {
      status: "error",
      message: "メルカリの商品ページを読み取れませんでした（削除済み・非公開、またはメルカリに拒否された可能性があります）。",
    };
  }
  if (!title || title === "メルカリ" || /日本最大のフリマ/.test(title)) {
    return {
      status: "error",
      message: "メルカリの商品ページを読み取れませんでした（削除済み・非公開の可能性があります）。",
    };
  }
  const image = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content") || "";
  const photos: ParsedPhoto[] = image ? [{ url: image, caption: "" }] : [];
  const listing: ParsedListing = {
    id: `mc_${rawId}`,
    source: "mercari",
    priceKind: "fixed",
    detailLevel: "partial",
    sourceUrl: mercariCanonical(rawId),
    title,
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
    photos,
    availability: "unknown",
  };
  return { status: "ok", listing };
}

/** 写真 _2, _3 … を HEAD で探す（404/403 で終了、最大10枚） */
async function probePhotos(first: string): Promise<ParsedPhoto[]> {
  const m = first.match(/^(https:\/\/static\.mercdn\.net\/.*\/photos\/m\d+_)1(\.jpg)(\?.*)?$/i);
  if (!m) return [];
  const urls = Array.from({ length: MAX_PHOTOS - 1 }, (_, i) => `${m[1]}${i + 2}${m[2]}`);
  const oks = await Promise.all(
    urls.map(async (u) => {
      try {
        const r = await fetch(u, {
          method: "HEAD",
          signal: AbortSignal.timeout(8000),
          headers: { "User-Agent": USER_AGENT },
        });
        return r.ok;
      } catch {
        return false;
      }
    }),
  );
  const out: ParsedPhoto[] = [];
  for (let i = 0; i < urls.length; i++) {
    if (!oks[i]) break;
    out.push({ url: urls[i], caption: "" });
  }
  return out;
}

export const mercari: Source = {
  id: "mercari",
  label: "メルカリ",
  allowedHosts: ["jp.mercari.com", "mercari.com"],
  photoHosts: ["static.mercdn.net"],
  priceLabelText: "価格",
  exampleUrl: "https://jp.mercari.com/item/m12345678901",
  match(text) {
    const m = URL_RE.exec(text || "");
    if (!m) return null;
    return { id: `mc_${m[1].toLowerCase()}`, canonicalUrl: mercariCanonical(m[1]), index: m.index };
  },
  async fetch(canonicalUrl) {
    const res = await fetchHtml(canonicalUrl, this.allowedHosts);
    if (!res.ok) return { httpStatus: res.httpStatus, parsed: { status: "error", message: res.message } };
    const parsed = parseMercariHtml(res.html, canonicalUrl);
    if (parsed.status !== "error" && parsed.listing.photos[0]) {
      parsed.listing.photos.push(...(await probePhotos(parsed.listing.photos[0].url)));
    }
    return { parsed, httpStatus: statusFor(parsed.status, res.status) };
  },
};
