import { safeNext } from "@/lib/line-login";
import { authSecret } from "@/lib/store";
import { YAHOO_STATE_COOKIE, isRegisteredHost, startYahooLogin, yahooLoginConfig } from "@/lib/yahoo-oauth";

export async function GET(request: Request) {
  const config = yahooLoginConfig();
  if (!config) {
    return new Response("Yahoo!ログインはまだ設定されていません。", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  if (!isRegisteredHost(request)) {
    return new Response(
      "Yahoo!ログインは本番のURL（https://oku-bice.vercel.app）からのみ使えます。",
      { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const { location, cookieValue } = startYahooLogin(await authSecret(), config.id, next);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "Set-Cookie": `${YAHOO_STATE_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    },
  });
}
