import { linkLineUser, linkedEmail } from "@/lib/line-link";
import { consumeLineLogin, safeNext } from "@/lib/line-login";
import { lineAccountId } from "@/lib/line-oauth";
import { sessionCookie, signSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const login = await consumeLineLogin(code);
  if (!login) {
    return new Response("このログインリンクは期限が切れています。LINEの画面からもう一度開いてください。", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  const selfAccount = lineAccountId(login.lineUserId);
  const linked = await linkedEmail(login.lineUserId);
  if (!linked) {
    await linkLineUser(login.lineUserId, selfAccount);
  }
  const account = linked && linked !== selfAccount ? `lineauth:${linked}` : selfAccount;
  const token = await signSession(account);
  const destination = new URL(safeNext(login.next), url.origin);
  return new Response(null, {
    status: 303,
    headers: {
      Location: destination.toString(),
      "Set-Cookie": sessionCookie(token),
    },
  });
}
