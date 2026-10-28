import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeAccountKey } from "@/lib/account";
import { authSecret } from "@/lib/store";

export const SESSION_COOKIE = "oku_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type Payload = {
  email: string;
  via?: "line";
  exp: number;
};

function sign(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadB64).digest("base64url");
}

function splitSessionEmail(raw: string): { email: string; via?: "line" } | null {
  if (raw.startsWith("lineauth:")) {
    const email = normalizeAccountKey(raw.slice("lineauth:".length));
    return email ? { email, via: "line" } : null;
  }
  const email = normalizeAccountKey(raw);
  return email ? { email } : null;
}

export async function signSession(rawEmail: string, now = Date.now()): Promise<string> {
  const parsed = splitSessionEmail(rawEmail);
  if (!parsed) throw new Error("Invalid session email");
  const secret = await authSecret();
  const payload: Payload = { ...parsed, exp: now + MAX_AGE_SECONDS * 1000 };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export async function verifySessionWithWay(token: string, now = Date.now()): Promise<{ email: string; via?: "line" } | null> {
  const [body, sig] = (token || "").split(".");
  if (!body || !sig) return null;
  const secret = await authSecret();
  const expected = Buffer.from(sign(body, secret));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    const email = normalizeAccountKey(payload.email);
    if (!email) return null;
    const via = payload.via === "line" || email.startsWith("line:") ? ("line" as const) : undefined;
    return { email, ...(via ? { via } : {}) };
  } catch {
    return null;
  }
}

export async function verifySession(token: string, now = Date.now()): Promise<string | null> {
  const session = await verifySessionWithWay(token, now);
  return session?.email ?? null;
}

export function readCookie(header: string | null, name = SESSION_COOKIE): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export async function readSessionWithWay(request?: Request): Promise<{ email: string; via?: "line" } | null> {
  if (request) {
    const token = readCookie(request.headers.get("cookie"));
    return token ? verifySessionWithWay(token) : null;
  }
  try {
    const { cookies } = await import("next/headers");
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value || "";
    return token ? verifySessionWithWay(token) : null;
  } catch {
    return null;
  }
}

export async function readSession(request?: Request): Promise<string | null> {
  const session = await readSessionWithWay(request);
  return session?.email ?? null;
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}${secure}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
