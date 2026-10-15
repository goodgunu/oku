/** Yahoo!オークションの出品ID（先頭1文字の英字 + 数字） */
const ID_RE = /\b([a-z]\d{8,12})\b/i;

const HOST_OK = (host: string) => {
  const h = host.toLowerCase();
  return (
    h === "auctions.yahoo.co.jp" ||
    h === "page.auctions.yahoo.co.jp" ||
    h.endsWith(".auctions.yahoo.co.jp")
  );
};

/**
 * ヤフオク出品URLを正規化する。
 * 対応例:
 * - https://auctions.yahoo.co.jp/jp/auction/h1248094934
 * - https://page.auctions.yahoo.co.jp/jp/auction/h1248094934
 * - テキスト中の ID のみ（ホスト付きURLが望ましいが ID 単独も可）
 */
export function canonicalYahooUrl(input: string): { id: string; url: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const idMatch = trimmed.match(ID_RE);
  if (!idMatch) return null;
  const id = idMatch[1].toLowerCase();

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      if (!HOST_OK(url.hostname)) return null;
    } catch {
      return null;
    }
  }

  return {
    id,
    url: `https://auctions.yahoo.co.jp/jp/auction/${id}`,
  };
}

/** テキストから最初のヤフオク出品URL/IDを探す */
export function extractYahooUrl(text: string): { id: string; url: string } | null {
  if (!text) return null;
  const urlMatch = text.match(
    /https?:\/\/(?:page\.)?auctions\.yahoo\.co\.jp\/jp\/auction\/([a-z]\d{8,12})/i,
  );
  if (urlMatch) {
    return canonicalYahooUrl(urlMatch[0]);
  }
  return canonicalYahooUrl(text);
}

export function isYahooListingId(id: string): boolean {
  return /^[a-z]\d{8,12}$/i.test(id);
}
