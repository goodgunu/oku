"use client";

import { useState } from "react";

const TAG_LIMIT = 12;
const FOLD_CHARS = 200;
const FOLD_LINES = 6;

// タグや特徴を小さな丸いラベルとして並べる。多いときは「もっと見る」で開く（のこす共通）
export function EquipmentTags({
  items: all,
  title = "タグ・特徴",
}: {
  items: string[] | undefined;
  title?: string;
}) {
  const [open, setOpen] = useState(false);
  const items = [...new Set((all ?? []).map((s) => s.trim()).filter(Boolean))];
  if (items.length === 0) return null;
  const shown = open ? items : items.slice(0, TAG_LIMIT);
  return (
    <section className="mt-6">
      <h2 className="border-b-2 border-[#ffdc00] pb-1 text-sm font-bold text-ink">
        {title} <span className="text-xs font-normal text-muted">{items.length}</span>
      </h2>
      <ul className="mt-3 flex flex-wrap gap-1.5">
        {shown.map((item) => (
          <li key={item} className="rounded-full border border-border bg-card px-2.5 py-1 text-xs leading-4 text-ink">
            {item}
          </li>
        ))}
      </ul>
      {items.length > TAG_LIMIT && (
        <button
          type="button"
          className="mt-3 text-xs text-muted underline underline-offset-4 hover:text-ink"
          onClick={() => setOpen(!open)}
        >
          {open ? "閉じる" : `もっと見る（あと${items.length - TAG_LIMIT}件）`}
        </button>
      )}
    </section>
  );
}

// 出品者の説明: 長いときだけ数行に畳み、「もっと見る」「閉じる」で開閉する（のこす共通）
export function FoldText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const long = text.length > FOLD_CHARS || text.split("\n").length > FOLD_LINES;
  return (
    <div className="mt-3 rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className={`text-sm leading-7 break-words whitespace-pre-wrap text-ink ${long && !open ? "line-clamp-5" : ""}`}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          className="mt-3 text-xs text-muted underline underline-offset-4 hover:text-ink"
          onClick={() => setOpen(!open)}
        >
          {open ? "閉じる" : "もっと見る"}
        </button>
      )}
    </div>
  );
}

export function DescriptionSection({
  text,
  title = "出品者の説明",
}: {
  text: string | undefined;
  title?: string;
}) {
  const body = (text || "").trim();
  if (!body) return null;
  return (
    <section className="mt-6">
      <h2 className="border-b-2 border-[#ffdc00] pb-1 text-sm font-bold text-ink">{title}</h2>
      <FoldText text={body} />
    </section>
  );
}
