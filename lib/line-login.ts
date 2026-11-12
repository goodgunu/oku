import { randomBytes } from "node:crypto";
import { safeLineUserId } from "@/lib/account";
import { deleteAppJson, readAppJson, writeAppJson } from "@/lib/store";

/** LINEトークに残る「おくで見る」ボタンから後から開いても使えるよう、7日間有効にする。 */
export const LOGIN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type LineLoginCode = {
  lineUserId: string;
  next: string;
  exp: number;
};

function key(code: string): string {
  return `line-login/${code}.json`;
}

export function safeNext(next: string | null | undefined): string {
  const n = (next || "").trim();
  return n.startsWith("/") && !n.startsWith("//") ? n : "/";
}

export async function issueLineLogin(lineUserId: string, next = "/", now = Date.now()): Promise<string> {
  if (!safeLineUserId(lineUserId)) throw new Error("Invalid LINE userId");
  const code = randomBytes(16).toString("hex");
  const record: LineLoginCode = { lineUserId, next: safeNext(next), exp: now + LOGIN_TTL_MS };
  await writeAppJson(key(code), record);
  return code;
}

/**
 * 同じリンクを何度開いても、有効期限内ならログインできるようにする。
 * （LINEのアプリ内ブラウザが先にプレビューで開いて、本タップ時に「期限切れ」になるのを防ぐ）
 */
export async function consumeLineLogin(code: string, now = Date.now()): Promise<LineLoginCode | null> {
  if (!/^[a-f0-9]{32}$/.test(code)) return null;
  const record = await readAppJson<LineLoginCode>(key(code));
  if (!record || !safeLineUserId(record.lineUserId) || record.exp < now) {
    if (record) await deleteAppJson(key(code)).catch(() => undefined);
    return null;
  }
  return { lineUserId: record.lineUserId, next: safeNext(record.next), exp: record.exp };
}
