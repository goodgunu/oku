import * as cheerio from "cheerio";
import { cleanText, formatYen } from "@/lib/format";
import { canonicalYahooUrl } from "@/lib/yahoo-url";
import type { ParseResult, ParsedListing, ParsedPhoto } from "@/lib/types";

type CheerioRoot = cheerio.CheerioAPI;

type NextItem = {
  auctionId?: string;
  title?: string;
  price?: number;
  taxinPrice?: number;
  bids?: number;
  biddersNum?: number;
  bidorbuy?: number;
  endTime?: string;
  formattedEndTime?: string;
  conditionName?: string;
  description?: string[] | string;
  descriptionHtml?: string;
  status?: string;
  auctionItemUrl?: string;
  seller?: {
    displayName?: string;
    aucUserId?: string;
    location?: { prefecture?: string; prefCode?: string };
  };
  chargeForShipping?: string;
  shipScheduleName?: string;
  shipping?: {
    methods?: { id?: string; name?: string; isFlatFee?: boolean }[];
  };
  img?: { image?: string; thumbnail?: string; caption?: string }[];
};

function readNextData($: CheerioRoot): NextItem | null {
  const raw = $("#__NEXT_DATA__").first().text();
  if (!raw.trim()) return null;
  try {
    const data = JSON.parse(raw) as {
      props?: {
        initialState?: {
          item?: { detail?: { item?: NextItem } };
        };
        pageProps?: {
          initialState?: {
            item?: { detail?: { item?: NextItem } };
          };
        };
      };
    };
    return (
      data.props?.initialState?.item?.detail?.item ||
      data.props?.pageProps?.initialState?.item?.detail?.item ||
      null
    );
  } catch {
    return null;
  }
}

export function htmlToText(html: string): string {
  const $ = cheerio.load(`<div id="r">${html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|li|tr|h[1-6])>/gi, "$&\n")}</div>`);
  $("script, style").remove();
  return $("#r").text();
}

function descriptionFromItem(item: NextItem): string {
  // descriptionHtml が全文。description 配列は末尾が「...」で切れていることがある。
  if (item.descriptionHtml && item.descriptionHtml.trim()) {
    return cleanText(htmlToText(item.descriptionHtml));
  }
  if (Array.isArray(item.description)) {
    return cleanText(item.description.filter((x) => x != null).join("\n"));
  }
  if (typeof item.description === "string" && item.description.trim()) {
    return cleanText(item.description);
  }
  return "";
}

function photosFromItem(item: NextItem): ParsedPhoto[] {
  const photos: ParsedPhoto[] = [];
  const seen = new Set<string>();
  for (const entry of item.img || []) {
    const url = entry.image || entry.thumbnail || "";
    if (!url || seen.has(url)) continue;
    seen.add(url);
    photos.push({ url, caption: entry.caption || "" });
  }
  return photos;
}


function prefectureFromItem(item: NextItem): string {
  return cleanText(item.seller?.location?.prefecture || "");
}

/** 送料の表示文言。金額はYahooが別APIのことが多く、負担区分と配送方法を優先する。 */
export function shippingFromItem(item: NextItem): string {
  const charge = String(item.chargeForShipping || "").toLowerCase();
  let who = "";
  if (charge === "seller") who = "送料無料（出品者負担）";
  else if (charge === "winner" || charge === "buyer") who = "落札者負担";
  else if (charge) who = charge;

  const methods = (item.shipping?.methods || [])
    .map((m) => cleanText(m.name || ""))
    .filter(Boolean);
  const method = methods.length ? methods.join("、") : "";
  const schedule = cleanText(item.shipScheduleName || "");

  const parts = [who, method, schedule].filter(Boolean);
  return parts.join(" · ") || "";
}

function listingFromNext(item: NextItem, sourceUrl: string): ParsedListing | null {
  const id = (item.auctionId || "").toLowerCase();
  if (!id) return null;
  const canonical = canonicalYahooUrl(item.auctionItemUrl || sourceUrl) || {
    id,
    url: `https://auctions.yahoo.co.jp/jp/auction/${id}`,
  };
  const priceYen =
    typeof item.price === "number" && Number.isFinite(item.price) ? item.price : null;
  const bidCount =
    typeof item.bids === "number"
      ? item.bids
      : typeof item.biddersNum === "number"
        ? item.biddersNum
        : null;
  const buyNowYen =
    typeof item.bidorbuy === "number" && item.bidorbuy > 0 ? item.bidorbuy : null;
  const closed = String(item.status || "").toLowerCase() === "closed";

  return {
    id: canonical.id,
    sourceUrl: canonical.url,
    title: cleanText(item.title || "") || `出品 ${canonical.id}`,
    priceYen,
    priceLabel: formatYen(priceYen),
    bidCount,
    seller: cleanText(item.seller?.displayName || ""),
    sellerId: item.seller?.aucUserId || "",
    endTime: item.endTime || "",
    endTimeLabel: item.formattedEndTime || item.endTime || "",
    condition: cleanText(item.conditionName || ""),
    prefecture: prefectureFromItem(item),
    shipping: shippingFromItem(item),
    description: descriptionFromItem(item),
    buyNowYen,
    photos: photosFromItem(item),
    availability: closed ? "ended" : "live",
  };
}

function listingFromOg($: CheerioRoot, sourceUrl: string): ParsedListing | null {
  const canonical = canonicalYahooUrl(sourceUrl);
  if (!canonical) return null;

  const ogTitle = cleanText($('meta[property="og:title"]').attr("content") || "");
  const titleTag = cleanText($("title").first().text() || "");
  let title = ogTitle || titleTag;
  title = title.replace(/\s*[-–|]\s*Yahoo!?オークション.*$/i, "").trim();
  if (!title) return null;

  const description = cleanText(
    $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "",
  );
  const image = $('meta[property="og:image"]').attr("content") || "";
  const bodyText = cleanText($("body").text());
  const ended = /このオークションは終了|終了しました|オークションは終了/.test(bodyText);

  return {
    id: canonical.id,
    sourceUrl: canonical.url,
    title,
    priceYen: null,
    priceLabel: "—",
    bidCount: null,
    seller: "",
    sellerId: "",
    endTime: "",
    endTimeLabel: "",
    condition: "",
    prefecture: "",
    shipping: "",
    description,
    buyNowYen: null,
    photos: image ? [{ url: image, caption: "" }] : [],
    availability: ended ? "ended" : "unknown",
  };
}

/**
 * ヤフオク出品ページの HTML をパースする。
 * 優先: __NEXT_DATA__ の item.detail.item → フォールバック: OGP
 */
export function parseYahooHtml(html: string, sourceUrl: string): ParseResult {
  if (!html || html.length < 40) {
    return { status: "error", message: "ページの内容を読み取れませんでした。" };
  }

  const $ = cheerio.load(html);
  const nextItem = readNextData($);
  if (nextItem) {
    const listing = listingFromNext(nextItem, sourceUrl);
    if (!listing) {
      return { status: "error", message: "出品情報を読み取れませんでした。" };
    }
    if (listing.availability === "ended") {
      return { status: "ended", listing };
    }
    return { status: "ok", listing };
  }

  // 404 / 削除ページ
  const title = cleanText($("title").first().text() || "");
  const body = cleanText($("body").text() || "");
  if (/404|見つかりません|ページが存在しません|削除された/.test(title + body) && !/og:title/.test(html)) {
    const canonical = canonicalYahooUrl(sourceUrl);
    return {
      status: "error",
      message: canonical
        ? `出品 ${canonical.id} のページが見つかりませんでした。`
        : "出品ページが見つかりませんでした。",
    };
  }

  const ogListing = listingFromOg($, sourceUrl);
  if (ogListing) {
    if (ogListing.availability === "ended") {
      return { status: "ended", listing: ogListing };
    }
    return { status: "ok", listing: ogListing };
  }

  return {
    status: "error",
    message: "ヤフオクの出品ページとして読み取れませんでした。",
  };
}

export type { ParseResult };
