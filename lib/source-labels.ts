import type { SourceId } from "@/lib/types";

/** クライアントでも使える軽い表示名（パーサを含めない） */
export const SOURCE_LABEL: Record<SourceId, string> = {
  "yahoo-auction": "ヤフオク",
  paypay: "PayPayフリマ",
  jmty: "ジモティー",
  mercari: "メルカリ",
};

export function sourceLabel(id: SourceId | undefined): string {
  return SOURCE_LABEL[id || "yahoo-auction"] || SOURCE_LABEL["yahoo-auction"];
}
