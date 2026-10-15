import { clerkEnabled } from "@/lib/account";
import { currentUser, unauthorized } from "@/lib/current-user";
import { finishLineConnectCode, readLineConnectCode } from "@/lib/line-connect-code";
import { linkLineUser } from "@/lib/line-link";
import { baseUrl } from "@/lib/line-message";
import { saveAndReply } from "@/lib/line-save";

export const maxDuration = 60;

export async function POST(request: Request) {
  if (!clerkEnabled()) {
    return Response.json({ message: "ログインを設定中です。しばらくしてからもう一度ひらいてください。" }, { status: 503 });
  }
  const user = await currentUser();
  if (!user) return unauthorized();
  let body: { code?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "リンクを読み取れませんでした。" }, { status: 400 });
  }
  const code = typeof body.code === "string" ? body.code : "";
  const login = await readLineConnectCode(code);
  if (!login) {
    return Response.json(
      { message: "このリンクは使えません。LINEの「おく」から、もう一度URLを送ってください。" },
      { status: 400 },
    );
  }
  await linkLineUser(login.lineUserId, user.email);
  if (login.href) return Response.json({ href: login.href });

  const reply = await saveAndReply({ folder: user.folder, url: login.url, origin: baseUrl(request) });
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";
  if (token) {
    await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ to: login.lineUserId, messages: reply.messages.slice(0, 5) }),
    }).catch(() => undefined);
  }
  if (!reply.record) {
    const first = reply.messages[0];
    return Response.json({ message: first?.type === "text" ? first.text : "保存できませんでした。" });
  }
  const href = `/listings/${reply.record.id}`;
  await finishLineConnectCode(code, href);
  return Response.json({ href });
}
