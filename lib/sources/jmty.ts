import { cleanText, formatYen } from "@/lib/format";
import { dig, readNextData, str } from "@/lib/sources/next-data";
import { fetchHtml, statusFor } from "@/lib/sources/http";
import type { Source } from "@/lib/sources/types";
import type { ParseResult, ParsedListing, ParsedPhoto } from "@/lib/types";

const URL_RE = /(?:^|[^a-z0-9.])(?:(?:www|m)\.)?jmty\.jp\/([a-z0-9-]+)\/([a-z0-9-]+)\/article-([a-z0-9]+)(?![a-z0-9])/i;

export function jmtyCanonical(pref: string, cat: string, key: string): string {
  return `https://jmty.jp/${pref.toLowerCase()}/${cat.toLowerCase()}/article-${key.toLowerCase()}`;
}

function priceFrom(field: string): Pick<ParsedListing, "priceYen" | "priceLabel" | "priceKind"> {
  const t = cleanText(field);
  if (!t) return { priceYen: null, priceLabel: "", priceKind: "fixed" };
  if (/無料|あげます/.test(t) || /^0円?$/.test(t)) return { priceYen: 0, priceLabel: "無料", priceKind: "free" };
  const m = t.match(/^([\d,]+)円$/);
  if (m) {
    const n = Number(m[1].replace(/,/g, ""));
    return { priceYen: n, priceLabel: formatYen(n), priceKind: n === 0 ? "free" : "fixed" };
  }
  return { priceYen: null, priceLabel: t, priceKind: "fixed" };
}

export function parseJmtyHtml(html: string, canonicalUrl: string): ParseResult {
  if (!html || html.length < 40) return { status: "error", message: "ページの内容を読み取れませんでした。" };
  const key = (canonicalUrl.match(/article-([a-z0-9]+)/i)?.[1] || "").toLowerCase();
  if (!key) return { status: "error", message: "出品情報を読み取れませんでした。" };

  const data = readNextData(html);
  const results = dig(data, "props", "pageProps", "articleResults") as Record<string, unknown> | undefined;
  const article = dig(results, "article") as Record<string, unknown> | undefined;
  let title = "";
  if (article && typeof article === "object") title = cleanText(str(article.title));
  if (!article || !title) {
    return { status: "error", message: "ジモティーの投稿ページとして読み取れませんでした（削除された可能性があります）。" };
  }

  const photos: ParsedPhoto[] = [];
  const seen = new Set<string>();
  for (const img of Array.isArray(article.images) ? (article.images as Record<string, unknown>[]) : []) {
    const url = str(img?.large_url) || str(img?.medium_url);
    if (url && !seen.has(url)) {
      seen.add(url);
      photos.push({ url, caption: "" });
    }
  }
  const loc = (Array.isArray(article.locations) ? article.locations[0] : null) as Record<string, unknown> | null;
  const prefecture =
    cleanText(str(dig(loc, "map", "area_name"))) ||
    cleanText(str(dig(loc, "prefecture", "name_with_suffix")) + str(dig(loc, "city", "name_with_suffix")));
  const ended = article.closed === true || article.destroyed === true;
  const seller = dig(results, "post_user") as Record<string, unknown> | undefined;
  
  const listing: ParsedListing = {
    id: `jm_${key}`,
    source: "jmty",
    detailLevel: "full",
    sourceUrl: canonicalUrl,
    title,
    ...priceFrom(str(article.important_field)),
    bidCount: null,
    seller: cleanText(str(seller?.name)),
    sellerId: str(seller?.id),
    endTime: "",
    endTimeLabel: "",
    condition: "",
    prefecture,
    shipping: "",
    description: cleanText(str(article.text).replace(/\r/g, "")),
    buyNowYen: null,
    photos,
    availability: ended ? "ended" : "live",
    category: [str(dig(article, "category_group", "shorten_name")), str(dig(article, "category", "name"))]
      .filter(Boolean)
      .join(" / "),
    postedAt: str(article.created_at),
  };
  return { status: ended ? "ended" : "ok", listing };
}

export const jmty: Source = {
  id: "jmty",
  label: "ジモティー",
  allowedHosts: ["jmty.jp"],
  photoHosts: ["cdn.jmty.jp", "jmty.jp"],
  priceLabelText: "価格",
  exampleUrl: "https://jmty.jp/tokyo/sale-ele/article-abc12",
  match(text) {
    const m = URL_RE.exec(text || "");
    if (!m) return null;
    return {
      id: `jm_${m[3].toLowerCase()}`,
      canonicalUrl: jmtyCanonical(m[1], m[2], m[3]),
      index: m.index,
    };
  },
  async fetch(canonicalUrl) {
    const res = await fetchHtml(canonicalUrl, this.allowedHosts);
    if (!res.ok) return { httpStatus: res.httpStatus, parsed: { status: "error", message: res.message } };
    const parsed = parseJmtyHtml(res.html, canonicalUrl);
    return { parsed, httpStatus: statusFor(parsed.status, res.status) };
  },
};

