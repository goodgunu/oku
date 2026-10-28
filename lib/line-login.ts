import { randomBytes } from "node:crypto";
import { safeLineUserId } from "@/lib/account";
import { deleteAppJson, readAppJson, writeAppJson } from "@/lib/store";

const TEN_MINUTES = 10 * 60 * 1000;

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

export async function issueLineLogin(lineUserId: string, next = "/"): Promise<string> {
  if (!safeLineUserId(lineUserId)) throw new Error("Invalid LINE userId");
  const code = randomBytes(16).toString("hex");
  const record: LineLoginCode = { lineUserId, next: safeNext(next), exp: Date.now() + TEN_MINUTES };
  await writeAppJson(key(code), record);
  return code;
}

export async function consumeLineLogin(code: string): Promise<LineLoginCode | null> {
  if (!/^[a-f0-9]{32}$/.test(code)) return null;
  const record = await readAppJson<LineLoginCode>(key(code));
  await deleteAppJson(key(code));
  if (!record || !safeLineUserId(record.lineUserId) || record.exp < Date.now()) return null;
  return { lineUserId: record.lineUserId, next: safeNext(record.next), exp: record.exp };
}
