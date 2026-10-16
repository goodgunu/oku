import * as cheerio from "cheerio";

export function readNextData(html: string): unknown {
  const $ = cheerio.load(html);
  const raw = $("#__NEXT_DATA__").first().text();
  if (!raw.trim()) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** 安全にたどる */
export function dig(obj: unknown, ...keys: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

export const str = (v: unknown): string => (typeof v === "string" ? v : "");
