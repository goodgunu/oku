import { randomBytes } from "node:crypto";
import { readAppJson, writeAppJson } from "@/lib/store";

const THIRTY_MINUTES = 30 * 60 * 1000;

export type ConnectCode = { lineUserId: string; url: string; exp: number; href?: string };

export async function createLineConnectLink(origin: string, lineUserId: string, url: string): Promise<string> {
  const code = randomBytes(16).toString("hex");
  await writeAppJson(`codes/${code}.json`, { lineUserId, url, exp: Date.now() + THIRTY_MINUTES } satisfies ConnectCode);
  return `${origin}/line/connect?code=${code}`;
}

export async function readLineConnectCode(code: string): Promise<ConnectCode | null> {
  if (!/^[a-f0-9]{32}$/.test(code)) return null;
  const record = await readAppJson<ConnectCode>(`codes/${code}.json`);
  if (!record?.lineUserId || !record.url || record.exp < Date.now()) return null;
  return record;
}

export async function finishLineConnectCode(code: string, href: string): Promise<void> {
  const record = await readLineConnectCode(code);
  if (record) await writeAppJson(`codes/${code}.json`, { ...record, href });
}
