export function formatYen(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return `${Math.round(value).toLocaleString("ja-JP")}円`;
}

export function cleanText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/[ \t\f\v]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .trim();
}

export type RemainingTime = {
  label: string;
  /** 残り1時間未満のとき true */
  urgent: boolean;
};

/** 終了時刻（ISO 等）から残り時間ラベルを作る。過去・無効なら null */
export function formatRemainingTime(endTime: string | null | undefined, nowMs: number): RemainingTime | null {
  if (!endTime) return null;
  const endMs = Date.parse(endTime);
  if (Number.isNaN(endMs)) return null;
  const diffMs = endMs - nowMs;
  if (diffMs <= 0) return null;

  const mins = Math.ceil(diffMs / 60_000);
  if (mins < 60) {
    return { label: `あと${mins}分`, urgent: true };
  }
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 24) {
    return { label: `あと${hours}時間`, urgent: false };
  }
  const days = Math.floor(hours / 24);
  return { label: `あと${days}日`, urgent: false };
}

/** 終了した出品の価格見出し（ヤフオクで入札ありは「落札価格」、それ以外は「最終価格」） */
export function endedPriceHeading(item: { source?: string; bidCount?: number | null }): string {
  if (item.source === "yahoo-auction" && item.bidCount != null && item.bidCount > 0) {
    return "落札価格";
  }
  return "最終価格";
}
