import { formatYen } from "@/lib/format";
import type { ArchiveRecord } from "@/lib/types";

export type LineMessage = { type: "text"; text: string } | { type: "flex"; altText: string; contents: Record<string, unknown> };

export function baseUrl(request?: Request): string {
  const env = (process.env.NEXT_PUBLIC_BASE_URL || "").trim().replace(/\/+$/, "");
  if (env) return env.startsWith("http") ? env : `https://${env}`;
  if (request) {
    const u = new URL(request.url);
    const host = request.headers.get("x-forwarded-host") || u.host;
    return `https://${host}`;
  }
  return "https://oku-bice.vercel.app";
}

export function buildSavedMessage(
  record: ArchiveRecord,
  opts: { origin: string; ended?: boolean; alreadySaved?: boolean },
): LineMessage[] {
  const link = `${opts.origin}/listings/${record.id}`;
  const label = [opts.ended ? "（終了済み）" : "", opts.alreadySaved ? "（保存済みなので更新しました）" : ""].join("");
  const rows = [
    record.priceLabel ? `現在価格: ${record.priceLabel}` : "",
    record.bidCount != null ? `入札: ${record.bidCount}件` : "",
    record.seller ? `出品者: ${record.seller}` : "",
    record.endTimeLabel ? `終了: ${record.endTimeLabel}` : "",
    record.buyNowYen ? `即決: ${formatYen(record.buyNowYen)}` : "",
    `ID: ${record.id}`,
  ].filter(Boolean);
  const headline = `おくったよ${label}`;

  const altText = [headline, record.title, ...rows, link].join("\n").slice(0, 400);
  const hasPhoto = Boolean(record.photos[0]?.key) && opts.origin.startsWith("https://");

  const bubble: Record<string, unknown> = {
    type: "bubble",
    ...(hasPhoto
      ? {
          hero: {
            type: "image",
            url: `${opts.origin}/api/photo/${record.id}/0`,
            size: "full",
            aspectRatio: "20:13",
            aspectMode: "cover",
          },
        }
      : {}),
    body: {
      type: "box",
      layout: "vertical",
      spacing: "sm",
      contents: [
        { type: "text", text: headline, size: "xs", color: "#888888" },
        { type: "text", text: record.title.slice(0, 200), weight: "bold", wrap: true },
        ...rows.map((r) => ({ type: "text", text: r, size: "sm", wrap: true })),
      ],
    },
    footer: {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "button",
          style: "primary",
          action: { type: "uri", label: "おくで見る", uri: link },
        },
      ],
    },
  };

  return [{ type: "flex", altText, contents: bubble }];
}
