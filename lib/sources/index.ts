import { jmty } from "@/lib/sources/jmty";
import { mercari } from "@/lib/sources/mercari";
import { paypay } from "@/lib/sources/paypay";
import { yahooAuction } from "@/lib/sources/yahoo-auction";
import type { FetchOutcome, Source, SourceMatch } from "@/lib/sources/types";
import type { SourceId } from "@/lib/types";

export const SOURCES: Source[] = [yahooAuction, paypay, jmty, mercari];

export function getSource(id: SourceId | undefined): Source {
  return SOURCES.find((s) => s.id === id) || yahooAuction;
}

/** 非ヤフオクのID prefix（ヤフオクのIDは英数字のみなので衝突しない） */
const NON_YAHOO_ID = /^(?:pp_z\d+|jm_[a-z0-9]+|mc_m\d+)$/i;
const YAHOO_ID = /^[a-z]?\d{8,12}$/i;

export function isListingId(id: string): boolean {
  return YAHOO_ID.test(id) || NON_YAHOO_ID.test(id);
}

export function sourceFromId(id: string): Source {
  const p = id.slice(0, 3).toLowerCase();
  if (p === "pp_") return paypay;
  if (p === "jm_") return jmty;
  if (p === "mc_") return mercari;
  return yahooAuction;
}

export function supportedSiteLabels(): string {
  return SOURCES.map((s) => s.label).join("・");
}

export function unsupportedMessage(): string {
  return `対応しているサイトの出品ページURLを貼ってください。\n対応: ${supportedSiteLabels()}\n例: ${SOURCES.map((s) => s.exampleUrl).join("\n　　")}`;
}

export type Extracted = SourceMatch & { source: Source };

/** テキストから最初に出てくる対応サイトの出品URLを探す */
export function extractListingUrl(text: string): Extracted | null {
  if (!text) return null;
  let best: Extracted | null = null;
  // 明確なURL形式のサイトを先に、ヤフオク（ID単独も許す）は最後に
  for (const source of [paypay, jmty, mercari, yahooAuction]) {
    const m = source.match(text);
    if (!m) continue;
    if (source === yahooAuction && best && best.index <= m.index) continue;
    if (!best || m.index < best.index) best = { ...m, source };
  }
  return best;
}

export async function fetchListing(input: string): Promise<FetchOutcome> {
  const hit = extractListingUrl(input);
  if (!hit) return { httpStatus: 400, parsed: { status: "error", message: unsupportedMessage() } };
  const out = await hit.source.fetch(hit.canonicalUrl);
  if (out.parsed.status !== "error" && !out.parsed.listing.source) out.parsed.listing.source = hit.source.id;
  return out;
}
