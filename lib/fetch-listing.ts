import { parseYahooHtml, type ParseResult } from "@/lib/parse-yahoo";
import { canonicalYahooUrl } from "@/lib/yahoo-url";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export async function fetchYahooListing(
  input: string,
): Promise<{ parsed: ParseResult; httpStatus: number }> {
  const canonical = canonicalYahooUrl(input);
  if (!canonical) {
    return {
      httpStatus: 400,
      parsed: {
        status: "error",
        message:
          "ヤフオクの出品ページのURLを貼ってください。（例: https://auctions.yahoo.co.jp/jp/auction/h1234567890）",
      },
    };
  }

  let response: Response;
  try {
    response = await fetch(canonical.url, {
      redirect: "follow",
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ja,en;q=0.8",
      },
    });
  } catch {
    return {
      httpStatus: 502,
      parsed: {
        status: "error",
        message: "出品ページへ接続できませんでした。通信状況を見て、もう一度試してください。",
      },
    };
  }

  let finalHost = "";
  try {
    finalHost = new URL(response.url).hostname.toLowerCase();
  } catch {
    finalHost = "";
  }
  if (!finalHost.endsWith("auctions.yahoo.co.jp")) {
    return {
      httpStatus: 502,
      parsed: { status: "error", message: "出品ページを取得できませんでした。" },
    };
  }

  const html = await response.text();
  if (html.length > 3_000_000) {
    return {
      httpStatus: 502,
      parsed: { status: "error", message: "ページが大きすぎて保存できませんでした。" },
    };
  }

  const parsed = parseYahooHtml(html, canonical.url);
  const httpStatus =
    parsed.status === "error" ? (response.status === 404 ? 404 : 422) : 200;
  return { parsed, httpStatus };
}
