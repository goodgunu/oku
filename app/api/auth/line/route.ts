import { linkLineUser, linkedEmail } from "@/lib/line-link";
import { consumeLineLogin, safeNext } from "@/lib/line-login";
import { lineAccountId } from "@/lib/line-oauth";
import { readSession, sessionCookie, signSession } from "@/lib/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code") || "";
  const login = await consumeLineLogin(code);
  if (!login) {
    const existing = await readSession(request);
    if (existing) {
      return new Response(null, {
        status: 303,
        headers: { Location: new URL("/", url.origin).toString() },
      });
    }
    return expiredPage();
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

function expiredPage(): Response {
  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>おく — ログイン</title>
  <style>
    body { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; background: #FAF7F2; color: #1C1917; margin: 0; padding: 24px; }
    .card { max-width: 400px; margin: 48px auto; background: #fff; border-radius: 20px; padding: 28px 24px; border: 1px solid #E5E0DA; box-shadow: 0 8px 24px rgba(0,0,0,.06); }
    .mark { display: inline-block; background: #ffdc00; color: #111; font-weight: 800; border-radius: 8px; padding: 4px 10px; font-size: 15px; margin-bottom: 16px; }
    h1 { font-size: 1.15rem; line-height: 1.45; margin: 0 0 12px; }
    p { font-size: 0.9rem; line-height: 1.75; color: #57534E; margin: 0 0 8px; }
    .btn { display: block; text-align: center; border-radius: 999px; padding: 14px 20px; font-weight: 700; text-decoration: none; margin-top: 14px; }
    .line { background: #06C755; color: #fff; }
    .home { background: #ffdc00; color: #111; }
  </style>
</head>
<body>
  <div class="card">
    <span class="mark">おく</span>
    <h1>このログインリンクは使えなくなっています</h1>
    <p>リンクの有効期限が切れたか、正しく開けなかったようです。</p>
    <p>下のボタンから、もう一度LINEでログインできます。</p>
    <a class="btn line" href="/api/auth/line-login?next=%2F">LINEで続ける</a>
    <a class="btn home" href="/">トップに戻る</a>
  </div>
</body>
</html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
