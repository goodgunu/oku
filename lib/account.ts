import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/** Clerk のキーが両方そろっているときだけログインを有効にする。無いときは従来どおり（ログインなし）で動く。 */
export function clerkEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY);
}

export function normalizeEmail(email: string): string {
  const e = String(email || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : "";
}

/** ユーザーごとの保存フォルダ名。ログインなしのときは従来の "me"。 */
export function userFolder(email: string): string {
  return createHash("sha256").update(String(email).trim().toLowerCase()).digest("hex").slice(0, 20);
}

export const LEGACY_FOLDER = "me";

export function isFolder(value: string): boolean {
  return value === LEGACY_FOLDER || /^[a-f0-9]{20}$/.test(value);
}

export function lineLinkKey(lineUserId: string): string {
  return `links/${createHash("sha256").update(lineUserId).digest("hex").slice(0, 40)}.json`;
}

export function safeLineUserId(value: string): boolean {
  return /^[A-Za-z0-9_-]{8,64}$/.test(value);
}

function photoSecret(): string {
  return process.env.AUTH_SECRET || process.env.CLERK_SECRET_KEY || "";
}

/** LINE のカードに出す写真用の署名。LINE のサーバーはログインできないので、URL に署名を付ける。 */
export function signPhoto(folder: string, id: string, index: number): string {
  const secret = photoSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(`${folder}:${id.toLowerCase()}:${index}`).digest("hex").slice(0, 32);
}

export function verifyPhoto(folder: string, id: string, index: number, sig: string): boolean {
  const expected = signPhoto(folder, id, index);
  if (!expected || !sig) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function photoUrl(origin: string, folder: string, id: string, index: number): string {
  const sig = signPhoto(folder, id, index);
  const base = `${origin}/api/photo/${id}/${index}`;
  return sig ? `${base}?u=${folder}&t=${sig}` : base;
}
