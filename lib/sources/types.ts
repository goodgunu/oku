import type { ParseResult, SourceId } from "@/lib/types";

export type SourceMatch = {
  /** 保存に使う ID（yahoo-auction 以外は prefix 付き） */
  id: string;
  canonicalUrl: string;
  /** テキスト内での位置（複数サイトのURLが混ざったとき、先に出たものを選ぶため） */
  index: number;
};

export type FetchOutcome = { parsed: ParseResult; httpStatus: number };

export type Source = {
  id: SourceId;
  /** 日本語の表示名 */
  label: string;
  /** 取得してよいページのホスト（リダイレクト先も検査） */
  allowedHosts: string[];
  /** 写真をダウンロードしてよいホスト */
  photoHosts: string[];
  /** 価格ラベル（現在価格 / 価格） */
  priceLabelText: string;
  exampleUrl: string;
  match(text: string): SourceMatch | null;
  fetch(canonicalUrl: string): Promise<FetchOutcome>;
};
