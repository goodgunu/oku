export const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function hostAllowed(host: string, allowed: string[]): boolean {
  const h = host.toLowerCase();
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

export type HtmlResult =
  | { ok: true; html: string; status: number }
  | { ok: false; httpStatus: number; message: string };

/** 許可ホストのページだけ取得する（リダイレクト先も確認）。 */
export async function fetchHtml(url: string, allowedHosts: string[]): Promise<HtmlResult> {
  let response: Response;
  try {
    response = await fetch(url, {
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
      ok: false,
      httpStatus: 502,
      message: "出品ページへ接続できませんでした。通信状況を見て、もう一度試してください。",
    };
  }
  let finalHost = "";
  try {
    finalHost = new URL(response.url).hostname.toLowerCase();
  } catch {
    finalHost = "";
  }
  if (!hostAllowed(finalHost, allowedHosts)) {
    return { ok: false, httpStatus: 502, message: "出品ページを取得できませんでした。" };
  }
  const html = await response.text();
  if (html.length > 3_000_000) {
    return { ok: false, httpStatus: 502, message: "ページが大きすぎて保存できませんでした。" };
  }
  return { ok: true, html, status: response.status };
}

export function statusFor(parsedStatus: string, httpStatus: number): number {
  return parsedStatus === "error" ? (httpStatus === 404 ? 404 : 422) : 200;
}
