/** Yahoo!オークションの出品ID（英字1文字 + 数字、または数字のみ） */
const ID_BODY = "[a-z]?\\d{8,12}";
const ID_ONLY_RE = new RegExp(`^${ID_BODY}$`, "i");
const BARE_ID_RE = new RegExp(`(?<![a-z0-9])(${ID_BODY})(?![a-z0-9])`, "i");

const HOST_OK = (host: string) => {
  const h = host.toLowerCase();
  return h === "auctions.yahoo.co.jp" || h === "yahoo.co.jp" || h.endsWith(".yahoo.co.jp");
};

function result(id: string) {
  const low = id.toLowerCase();
  return { id: low, url: `https://auctions.yahoo.co.jp/jp/auction/${low}` };
}

function idFromUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!HOST_OK(url.hostname)) return null;
  const aid = url.searchParams.get("aID") || url.searchParams.get("aid");
  if (aid && ID_ONLY_RE.test(aid)) return aid;
  const m = url.pathname.match(new RegExp(`/auction/(${ID_BODY})(?![a-z0-9])`, "i"));
  return m ? m[1] : null;
}

/**
 * ヤフオク出品URLを正規化する。
 * 対応: /jp/auction/<id>, /auction/<id>, page.auctions.yahoo.co.jp, ?aID=<id>,
 * URL の前後に日本語テキストが付いた共有文、ID単独。
 */
export function canonicalYahooUrl(input: string): { id: string; url: string } | null {
  const trimmed = (input || "").trim();
  if (!trimmed) return null;

  const hasUrl = /https?:\/\//i.test(trimmed);
  if (hasUrl) {
    // スキームなしの前後文字（日本語・空白）で切る
    for (const m of trimmed.matchAll(/https?:\/\/[\x21-\x7e]+/gi)) {
      const id = idFromUrl(m[0]);
      if (id) return result(id);
    }
    return null;
  }

  const bare = trimmed.match(
    new RegExp(`(?:^|[^a-z0-9])(?:[a-z0-9.]*yahoo\\.co\\.jp)?/?(?:jp/)?auction/(${ID_BODY})(?![a-z0-9])`, "i"),
  );
  if (bare) return result(bare[1]);
  const aid = trimmed.match(new RegExp(`aID=(${ID_BODY})(?![a-z0-9])`, "i"));
  if (aid) return result(aid[1]);
  const id = trimmed.match(BARE_ID_RE);
  return id ? result(id[1]) : null;
}

/** テキストから最初のヤフオク出品URL/IDを探す */
export function extractYahooUrl(text: string): { id: string; url: string } | null {
  if (!text) return null;
  return canonicalYahooUrl(text);
}

export function isYahooListingId(id: string): boolean {
  return ID_ONLY_RE.test(id);
}
