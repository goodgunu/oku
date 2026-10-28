import { formatYen } from "@/lib/format";
import { sourceLabel } from "@/lib/source-labels";
import type { ArchiveRecord } from "@/lib/types";

export type CompareRow = {
  label: string;
  value: (record: ArchiveRecord) => string;
  rank?: (record: ArchiveRecord) => number | null;
  better?: "low" | "high";
};

export const COMPARE_ROWS: CompareRow[] = [
  {
    label: "価格",
    value: (r) => (r.priceLabel && r.priceLabel !== "—" ? r.priceLabel : r.priceYen != null ? formatYen(r.priceYen) : "未記載"),
    rank: (r) => r.priceYen,
    better: "low",
  },
  {
    label: "即決価格",
    value: (r) => (r.buyNowYen != null ? formatYen(r.buyNowYen) : "未記載"),
    rank: (r) => r.buyNowYen,
    better: "low",
  },
  {
    label: "入札件数",
    value: (r) => (r.bidCount != null ? `${r.bidCount}件` : "未記載"),
  },
  {
    label: "サイト",
    value: (r) => sourceLabel(r.source),
  },
  {
    label: "状態",
    value: (r) => r.condition || "未記載",
  },
  {
    label: "送料・発送",
    value: (r) => r.shipping || "未記載",
  },
  {
    label: "出品地域",
    value: (r) => r.prefecture || "未記載",
  },
  {
    label: "出品者",
    value: (r) => r.seller || "未記載",
  },
  {
    label: "掲載状態",
    value: (r) => (r.availability === "ended" ? "終了" : r.availability === "live" ? "出品中" : "不明"),
  },
  {
    label: "終了日時",
    value: (r) => r.endTimeLabel || "未記載",
  },
];

export function bestIds(records: ArchiveRecord[], row: CompareRow): Set<string> {
  if (!row.rank || !row.better) return new Set();
  const values = records
    .map((r) => ({ id: r.id, v: row.rank!(r) }))
    .filter((x): x is { id: string; v: number } => x.v != null);
  if (values.length < 2) return new Set();
  const target = row.better === "low" ? Math.min(...values.map((x) => x.v)) : Math.max(...values.map((x) => x.v));
  if (values.every((x) => x.v === target)) return new Set();
  return new Set(values.filter((x) => x.v === target).map((x) => x.id));
}
