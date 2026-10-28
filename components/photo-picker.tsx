"use client";

import { useState } from "react";
import type { ParsedPhoto } from "@/lib/types";

export const PHOTO_KEEP_LIMIT = 40;

export function PhotoPicker({
  title,
  photos,
  replacing,
  busy,
  onKeep,
  onTextOnly,
  onCancel,
}: {
  title: string;
  photos: (ParsedPhoto & { src?: string })[];
  replacing: boolean;
  busy: string;
  onKeep: (indexes: number[]) => void;
  onTextOnly?: () => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<number[]>(() =>
    photos.map((_, index) => index).slice(0, PHOTO_KEEP_LIMIT),
  );
  const [notice, setNotice] = useState("");

  function toggle(index: number) {
    setSelected((current) => {
      if (current.includes(index)) return current.filter((item) => item !== index);
      if (current.length >= PHOTO_KEEP_LIMIT) {
        setNotice(`1件につき${PHOTO_KEEP_LIMIT}枚まで残せます。`);
        return current;
      }
      setNotice("");
      return [...current, index];
    });
  }

  function selectAll() {
    const next = photos.map((_, index) => index).slice(0, PHOTO_KEEP_LIMIT);
    setSelected(next);
    setNotice(photos.length > PHOTO_KEEP_LIMIT ? `先頭の${PHOTO_KEEP_LIMIT}枚を選びました。` : "");
  }

  return (
    <section className="rounded-2xl border border-border bg-card px-4 py-5 shadow-sm sm:px-6">
      <h2 className="text-lg font-bold text-ink">残す写真を選ぶ</h2>
      <p className="mt-2 text-sm leading-7 text-muted">
        {title}の写真を{photos.length}枚表示しています。不要な画像は外して、残したい写真だけ選んでください。選んでいない写真は保存しません。
        {replacing ? " 保存すると、今残している写真はこの選択に入れ替わります。" : ""}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={selectAll}
          disabled={!photos.length || Boolean(busy)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-ink hover:bg-card disabled:opacity-50"
        >
          全部選ぶ
        </button>
        <button
          type="button"
          onClick={() => setSelected([])}
          disabled={Boolean(busy)}
          className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-bold text-ink hover:bg-card disabled:opacity-50"
        >
          選択を外す
        </button>
        <p className="self-center text-sm font-bold text-muted">{selected.length}枚を残す</p>
      </div>
      {photos.length === 0 ? (
        <p className="mt-6 text-sm text-muted">この出品からは写真を取れませんでした。文章だけ残せます。</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo, index) => {
            const on = selected.includes(index);
            const label = photo.caption || `写真 ${index + 1}`;
            const imgSrc = photo.src || photo.url;
            return (
              <li key={`${imgSrc}-${index}`} className="min-w-0">
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(index)}
                  className={`w-full overflow-hidden rounded-xl border text-left transition ${
                    on ? "border-[#ffdc00] ring-2 ring-[#ffdc00]" : "border-border"
                  }`}
                >
                  <span className="relative block aspect-[4/3] bg-background">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgSrc} alt={label} loading="lazy" className="size-full object-cover" />
                    {on && (
                      <span className="absolute top-2 left-2 rounded-full bg-[#ffdc00] px-2 py-0.5 text-xs font-bold text-black shadow-2xs">
                        残す
                      </span>
                    )}
                  </span>
                  <span className="line-clamp-2 block px-2 py-1.5 text-xs leading-5 text-ink">{label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {notice && <p className="mt-3 text-sm font-bold text-ink">{notice}</p>}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="h-11 rounded-full bg-[#ffdc00] px-5 text-sm font-bold text-black hover:bg-[#f5c400] disabled:opacity-50"
          disabled={Boolean(busy)}
          onClick={() => onKeep(selected)}
        >
          {busy || (selected.length ? `選んだ${selected.length}枚を残す` : "写真なしで残す")}
        </button>
        {replacing && onTextOnly && (
          <button
            type="button"
            className="h-11 rounded-full border border-border bg-background px-4 text-sm font-bold text-ink hover:bg-card disabled:opacity-50"
            disabled={Boolean(busy)}
            onClick={onTextOnly}
          >
            今の写真のまま、文章だけ更新
          </button>
        )}
        <button
          type="button"
          className="h-11 rounded-full border border-border bg-background px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
          disabled={Boolean(busy)}
          onClick={onCancel}
        >
          やめる
        </button>
      </div>
    </section>
  );
}
