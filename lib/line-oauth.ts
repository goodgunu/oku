import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { safeLineUserId } from "@/lib/account";
import { safeNext } from "@/lib/line-login";

export const LINE_STATE_COOKIE = "oku_line_oauth";
const AUTHORIZE = "https://access.line.me/oauth2/v2.1/authorize";
const TOKEN = "https://api.line.me/oauth2/v2.1/token";
const VERIFY = "https://api.line.me/oauth2/v2.1/verify";

export function lineLoginConfig(): { id: string; secret: string } | null {
  const id = (process.env.LINE_LOGIN_CHANNEL_ID || "").trim();
  const secret = (process.env.LINE_LOGIN_CHANNEL_SECRET || "").trim();
  return id && secret ? { id, secret } : null;
}

export function lineCallbackUri(request: Request): string {
  const env = (process.env.LINE_LOGIN_REDIRECT_URI || "").trim();
  if (env) return env;
  const host = request.headers.get("x-forwarded-host") || new URL(request.url).host;
  const proto = request.headers.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/auth/line-login/callback`;
}

export function lineAccountId(sub: string): string {
  return `line:${sub.trim()}`;
}

type Pending = {
  state: string;
  nonce: string;
  next: string;
  link?: string;
  exp: number;
};

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function startLineLogin(
  secret: string,
  channelId: string,
  redirectUri: string,
  nextPath: string,
  linkAccount?: string,
) {
  const pending: Pending = {
    state: randomBytes(16).toString("hex"),
    nonce: randomBytes(16).toString("hex"),
    next: safeNext(nextPath),
    ...(linkAccount ? { link: linkAccount } : {}),
    exp: Date.now() + 10 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(pending)).toString("base64url");
  const url = new URL(AUTHORIZE);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", channelId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("state", pending.state);
  url.searchParams.set("scope", "profile openid");
  url.searchParams.set("nonce", pending.nonce);
  url.searchParams.set("bot_prompt", "normal");
  return { location: url.toString(), cookieValue: `${payload}.${sign(payload, secret)}` };
}

export function readLinePending(cookie: string, secret: string): Pending | null {
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Pending;
    return parsed.exp > Date.now() ? parsed : null;
  } catch {
    return null;
  }
}

export async function exchangeLineCode(
  code: string,
  redirectUri: string,
  nonce: string,
  config: { id: string; secret: string },
): Promise<{ sub: string } | null> {
  const tokenRes = await fetch(TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: config.id,
      client_secret: config.secret,
    }),
  });
  if (!tokenRes.ok) return null;
  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) return null;

  const verifyRes = await fetch(VERIFY, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      id_token: tokens.id_token,
      client_id: config.id,
      nonce,
    }),
  });
  if (!verifyRes.ok) return null;
  const verified = (await verifyRes.json()) as { sub?: string };
  if (!verified.sub || !safeLineUserId(verified.sub)) return null;
  return { sub: verified.sub };
}
