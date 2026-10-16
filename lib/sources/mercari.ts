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

export const MERCARI_NOTE =
  "メルカリの詳しい情報を読み取れなかったため、タイトルと写真のみ保存しています（時間をおいてもう一度URLを送ると、詳細まで保存できることがあります）";

const toLines = (html: string): string[] => {
  const $ = cheerio.load(html);
  $("script,style,noscript").remove();
  $("br,div,p,li,span,h1,h2,h3,dt,dd,tr,td,th,a,button").each((_, el) => {
    $(el).append("\n").prepend("\n");
  });
  return $("body")
    .text()
    .split("\n")
    .map((l) => l.replace(/\u00a0/g, " ").trim())
    .filter(Boolean);
};

const after = (lines: string[], label: string, n = 1): string[] => {
  const i = lines.indexOf(label);
  return i < 0 ? [] : lines.slice(i + 1, i + 1 + n);
};

/** ブラウザで描画済みのHTML（JSON-LD付き）から詳細まで読む。取れなければ null。 */
export function parseMercariRendered(html: string, canonicalUrl: string): ParseResult | null {
  const rawId = (canonicalUrl.match(/\/item\/(m\d+)/i)?.[1] || "").toLowerCase();
  if (!rawId || !html) return null;
  const $ = cheerio.load(html);
  let product: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const j = JSON.parse($(el).contents().text());
      const nodes: unknown[] = Array.isArray(j) ? j : Array.isArray(j?.["@graph"]) ? j["@graph"] : [j];
      for (const n of nodes) {
        if (n && typeof n === "object" && (n as { "@type"?: string })["@type"] === "Product") product = n as Record<string, unknown>;
      }
    } catch {
      /* ignore */
    }
  });
  const p = product as Record<string, unknown> | null;
  if (!p || typeof p.name !== "string" || !p.name.trim()) return null;
  const offers = (Array.isArray(p.offers) ? p.offers[0] : p.offers) as Record<string, unknown> | undefined;
  const price = Number(offers?.price);
  const avail = String(offers?.availability || "");
  const ended = /SoldOut|OutOfStock/i.test(avail);
  const live = /InStock/i.test(avail);
  const images = (Array.isArray(p.image) ? p.image : p.image ? [p.image] : []).filter((u): u is string => typeof u === "string");
  const lines = toLines(html);
  const shipBear = after(lines, "配送料の負担")[0] || "";
  const shipWay = after(lines, "配送の方法")[0] || "";
  const sellerIdx = lines.indexOf("出品者");
  const listing: ParsedListing = {
    id: `mc_${rawId}`,
    source: "mercari",
    priceKind: "fixed",
    detailLevel: "full",
    sourceUrl: mercariCanonical(rawId),
    title: cleanMercariTitle(p.name),
    priceYen: Number.isFinite(price) && price > 0 ? price : null,
    priceLabel: "",
    bidCount: null,
    seller: sellerIdx >= 0 ? lines[sellerIdx + 1] || "" : "",
    sellerId: "",
    endTime: "",
    endTimeLabel: "",
    condition: after(lines, "商品の状態")[0] || "",
    prefecture: after(lines, "発送元の地域")[0] || "",
    shipping: [shipBear, shipWay].filter(Boolean).join(" / "),
    description: typeof p.description === "string" ? p.description.replace(/\r/g, "").trim() : "",
    buyNowYen: null,
    photos: images.slice(0, MAX_PHOTOS).map((url) => ({ url, caption: "" })),
    availability: ended ? "ended" : live ? "live" : "unknown",
    category: (() => {
      const i = lines.indexOf("カテゴリー");
      return i < 0 ? undefined : lines.slice(i + 1, i + 4).filter((l) => !/^(ブランド|商品の状態)$/.test(l)).join(" > ") || undefined;
    })(),
  };
  return { status: ended ? "ended" : "ok", listing };
}

const cfBrowserEnabled = () => Boolean(process.env.CF_ACCOUNT_ID && process.env.CF_BROWSER_TOKEN);

/** Cloudflare のブラウザで描画したHTMLを取る。失敗・タイムアウト・未設定なら null。 */
async function fetchRenderedHtml(url: string): Promise<string | null> {
  if (!cfBrowserEnabled()) return null;
  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/browser-rendering/content`,
      {
        method: "POST",
        signal: AbortSignal.timeout(30000),
        headers: { Authorization: `Bearer ${process.env.CF_BROWSER_TOKEN}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          gotoOptions: { waitUntil: "domcontentloaded", timeout: 20000 },
          waitForSelector: { selector: 'script[type="application/ld+json"]', timeout: 8000 },
          rejectResourceTypes: ["image", "stylesheet", "font", "media"],
        }),
      },
    );
    if (!res.ok) return null;
    const j = (await res.json()) as { success?: boolean; result?: unknown };
    return j.success && typeof j.result === "string" ? j.result : null;
  } catch {
    return null;
  }
}

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
    const rendered = await fetchRenderedHtml(canonicalUrl);
    const full = rendered ? parseMercariRendered(rendered, canonicalUrl) : null;
    if (full && full.status !== "error") return { parsed: full, httpStatus: 200 };
    const res = await fetchHtml(canonicalUrl, this.allowedHosts);
    if (!res.ok) return { httpStatus: res.httpStatus, parsed: { status: "error", message: res.message } };
    const parsed = parseMercariHtml(res.html, canonicalUrl);
    if (parsed.status !== "error" && parsed.listing.photos[0]) {
      parsed.listing.photos.push(...(await probePhotos(parsed.listing.photos[0].url)));
    }
    return { parsed, httpStatus: statusFor(parsed.status, res.status) };
  },
};
