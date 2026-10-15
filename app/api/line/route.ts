import { createHmac, timingSafeEqual } from "node:crypto";
import { LEGACY_FOLDER, clerkEnabled, userFolder } from "@/lib/account";
import { baseUrl, buildConnectMessage, type LineMessage } from "@/lib/line-message";
import { createLineConnectLink } from "@/lib/line-connect-code";
import { linkedEmail } from "@/lib/line-link";
import { saveAndReply } from "@/lib/line-save";
import { extractYahooUrl } from "@/lib/yahoo-url";

export const maxDuration = 60;

type LineEvent = {
  type?: string;
  replyToken?: string;
  source?: { userId?: string };
  message?: { type?: string; text?: string };
};

/**
 * LINE Messaging API webhook。
 * 環境変数:
 * - LINE_CHANNEL_SECRET … 署名検証（未設定なら検証スキップ＝開発用）
 * - LINE_CHANNEL_ACCESS_TOKEN … 返信に必要
 */
export async function POST(request: Request) {
  const secret = process.env.LINE_CHANNEL_SECRET || "";
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN || "";

  const body = await request.text();
  const signature = request.headers.get("x-line-signature") || "";

  if (secret) {
    if (!validLineSignature(body, secret, signature)) {
      return new Response("署名が違います。", { status: 401 });
    }
  }

  let events: LineEvent[] = [];
  try {
    const parsed = JSON.parse(body) as { events?: LineEvent[] };
    events = Array.isArray(parsed.events) ? parsed.events : [];
  } catch {
    return new Response("読めませんでした。", { status: 400 });
  }

  for (const event of events) {
    if (!event.replyToken) continue;
    const reply = await handleEvent(event, baseUrl(request));
    if (token) {
      await sendLine(token, "https://api.line.me/v2/bot/message/reply", {
        replyToken: event.replyToken,
        messages: reply,
      });
    }
  }

  return new Response("ok");
}

async function handleEvent(event: LineEvent, origin: string): Promise<LineMessage[]> {
  if (event.type === "follow") {
    return [
      {
        type: "text",
        text: "おくです。ヤフオクの出品ページURLを送ると、終了前に内容をメモとして残します。",
      },
    ];
  }

  if (event.type !== "message" || event.message?.type !== "text") {
    return [{ type: "text", text: "ヤフオクの出品URLをテキストで送ってください。" }];
  }

  const text = event.message.text || "";
  const canonical = extractYahooUrl(text);
  if (!canonical) {
    return [
      {
        type: "text",
        text: "ヤフオクの出品ページURLが見つかりませんでした。\n例: https://auctions.yahoo.co.jp/jp/auction/h1234567890",
      },
    ];
  }

  // ログインが有効なら、LINEとGoogleアカウントの連携が必要
  let folder = LEGACY_FOLDER;
  if (clerkEnabled()) {
    const lineUserId = event.source?.userId || "";
    const email = lineUserId ? await linkedEmail(lineUserId) : null;
    if (!email) {
      if (!lineUserId) return [{ type: "text", text: "このトークでは連携できません。1対1のトークで送ってください。" }];
      const link = await createLineConnectLink(origin, lineUserId, canonical.url);
      return buildConnectMessage(link);
    }
    folder = userFolder(email);
  }

  return (await saveAndReply({ folder, url: canonical.url, origin })).messages;
}

function validLineSignature(body: string, secret: string, signature: string): boolean {
  if (!signature) return false;
  const digest = createHmac("sha256", secret).update(body).digest("base64");
  try {
    const a = Buffer.from(digest);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

async function sendLine(
  token: string,
  url: string,
  body: { messages: LineMessage[]; replyToken?: string; to?: string },
): Promise<boolean> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ...body, messages: body.messages.slice(0, 5) }),
  }).catch(() => null);
  return Boolean(response?.ok);
}
