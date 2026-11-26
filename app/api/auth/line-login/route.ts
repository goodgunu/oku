import { currentUser } from "@/lib/current-user";
import { safeNext } from "@/lib/line-login";
import { LINE_STATE_COOKIE, lineCallbackUri, lineLoginConfig, startLineLogin } from "@/lib/line-oauth";
import { readCookie } from "@/lib/session";
import { authSecret } from "@/lib/store";

export async function GET(request: Request) {
  const config = lineLoginConfig();
  if (!config) {
    return new Response("LINEログインはまだ設定されていません。", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get("next"));
  const wantsLink = url.searchParams.get("link") === "1";
  let linkAccount: string | undefined;
  if (wantsLink) {
    const user = await currentUser(request);
    if (!user) {
      return new Response(null, {
        status: 303,
        headers: { Location: new URL("/?login=1", url.origin).toString() },
      });
    }
    linkAccount = user.email;
  }
  const redirectUri = lineCallbackUri(request);
  const { location, cookieValue } = startLineLogin(
    await authSecret(),
    config.id,
    redirectUri,
    next,
    linkAccount,
    readCookie(request.headers.get("cookie"), LINE_STATE_COOKIE),
  );
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return new Response(null, {
    status: 303,
    headers: {
      Location: location,
      "Set-Cookie": `${LINE_STATE_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600${secure}`,
    },
  });
}
