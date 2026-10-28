import { safeNext } from "@/lib/line-login";
import { readCookie, sessionCookie, signSession } from "@/lib/session";
import { authSecret } from "@/lib/store";
import { YAHOO_STATE_COOKIE, exchangeYahooCode, readYahooPending, yahooLoginConfig } from "@/lib/yahoo-oauth";

const CLEAR_STATE = `${YAHOO_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function fail(message: string): Response {
  return new Response(message, {
    status: 400,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Set-Cookie": CLEAR_STATE },
  });
}

export async function GET(request: Request) {
  const config = yahooLoginConfig();
  if (!config) return fail("Yahoo!ログインはまだ設定されていません。");
  const url = new URL(request.url);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const pending = readYahooPending(readCookie(request.headers.get("cookie"), YAHOO_STATE_COOKIE), await authSecret());
  if (!code || !pending || state !== pending.state) {
    return fail("Yahoo!の確認ができませんでした。もう一度お試しください。");
  }
  const profile = await exchangeYahooCode(code, pending.verifier, pending.nonce, config);
  if (!profile) {
    return fail("Yahoo!からアカウント情報を取得できませんでした。もう一度お試しください。");
  }
  const token = await signSession(`yahoo:${profile.sub}`);
  const destination = new URL(safeNext(pending.next), url.origin);
  const headers = new Headers({ Location: destination.toString() });
  headers.append("Set-Cookie", CLEAR_STATE);
  headers.append("Set-Cookie", sessionCookie(token));
  return new Response(null, { status: 303, headers });
}
