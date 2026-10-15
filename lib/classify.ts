import type { ArchiveRecord } from "@/lib/types";

export type Filter = "all" | "live" | "ended";

/** 終了判定: 保存データが ended、または終了時刻が過去なら ended。時刻なし/解釈不能は出品中。 */
export function classify(
  r: Pick<ArchiveRecord, "availability" | "endTime">,
  now: number = Date.now(),
): "live" | "ended" {
  if (r.availability === "ended") return "ended";
  const t = r.endTime ? Date.parse(r.endTime) : NaN;
  if (Number.isFinite(t) && t <= now) return "ended";
  return "live";
}

export function countByFilter(list: Pick<ArchiveRecord, "availability" | "endTime">[], now: number = Date.now()) {
  const c = { all: list.length, live: 0, ended: 0 };
  for (const r of list) c[classify(r, now)]++;
  return c;
}
