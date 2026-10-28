"use client";

import { useMemo, useState } from "react";
import { Share } from "lucide-react";
import {
  COMMENT_LIMIT,
  PHOTO_LIMIT,
  X_LIMIT,
  intentUrl,
  postBody,
  postText,
  publicListingOf,
  togglePhoto,
  weightedLength,
} from "@/lib/share";
import type { ArchiveRecord } from "@/lib/types";

export function XIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function isMobile(): boolean {
  return typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function photoSrcOf(record: ArchiveRecord, index: number): string {
  const p = record.photos[index];
  if (!p) return "";
  return p.key ? `/api/photo/${record.id}/${index}` : p.url;
}

export function ShareXSheet({
  record,
  open,
  onOpenChange,
  mode = "x",
}: {
  record: ArchiveRecord;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "x" | "native";
}) {
  const total = record.photos?.length ?? 0;
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState<number[]>(() =>
    Array.from({ length: Math.min(PHOTO_LIMIT, total) }, (_, i) => i),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const listing = useMemo(() => publicListingOf(record, selected[0] ?? 0), [record, selected]);
  const body = postBody(comment, listing);
  const length = weightedLength(body);
  const over = length > X_LIMIT;
  const preview = `${body}\nhttps://…/s/…`;

  if (!open) return null;

  async function share() {
    if (busy || over) return;
    setBusy(true);
    setError("");
    setCopied(false);
    const mobile = isMobile();
    const popup = !mobile && mode === "x" ? window.open("", "_blank") : null;
    try {
      const res = await fetch(`/api/library/${record.id}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverIndex: selected[0] ?? 0 }),
      });
      if (!res.ok) throw new Error("共有ページを作れませんでした。");
      const data = (await res.json()) as { path: string };
      const url = `${window.location.origin}${data.path}`;

      if (mobile && typeof navigator.share === "function" && selected.length > 0) {
        try {
          const files: File[] = [];
          for (const index of selected) {
            const response = await fetch(photoSrcOf(record, index), { cache: "no-store" });
            if (!response.ok) continue;
            const blob = await response.blob();
            const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg";
            files.push(new File([blob], `oku-${files.length + 1}.${ext}`, { type: blob.type || "image/jpeg" }));
          }
          const payload = { files, text: postText(comment, listing, url) };
          if (files.length > 0 && navigator.canShare?.(payload)) {
            await navigator.share(payload);
            onOpenChange(false);
            return;
          }
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") return;
        }
      }

      if (mode === "native") {
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
        } catch {
          setError(`コピーできませんでした。このURLを使ってください: ${url}`);
        }
        return;
      }

      const target = intentUrl(comment, listing, url);
      if (popup) {
        popup.opener = null;
        popup.location.href = target;
      } else {
        window.location.assign(target);
      }
      onOpenChange(false);
    } catch (e) {
      popup?.close();
      setError(e instanceof Error ? e.message : "共有できませんでした。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">{mode === "x" ? "Xで共有" : "共有"}</h2>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-2 py-1 text-xs text-muted hover:bg-background"
          >
            閉じる
          </button>
        </div>
        <p className="text-xs leading-5 text-muted">
          {mode === "x"
            ? "押すと、この出品の共有ページ（自分のメモは出ません）ができて、Xの投稿画面が開きます。"
            : "押すと、この出品の共有ページ（自分のメモは出ません）ができて、共有メニューまたはURLコピーができます。"}
        </p>

        <label className="block">
          <span className="text-xs font-bold text-ink">
            ひとこと（{comment.length}/{COMMENT_LIMIT}）
          </span>
          <input
            value={comment}
            maxLength={COMMENT_LIMIT}
            onChange={(event) => setComment(event.target.value)}
            placeholder="例: これ状態良さそう"
            className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3 text-sm"
          />
        </label>

        <div>
          <p className="text-xs font-bold text-ink">
            写真を選ぶ（{selected.length}/{PHOTO_LIMIT}）
          </p>
          {total > 0 ? (
            <div className="mt-1.5 grid grid-cols-4 gap-1.5">
              {Array.from({ length: total }, (_, index) => {
                const order = selected.indexOf(index);
                return (
                  <button
                    key={index}
                    type="button"
                    aria-pressed={order >= 0}
                    aria-label={`写真${index + 1}`}
                    onClick={() => setSelected((current) => togglePhoto(current, index))}
                    className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                      order >= 0 ? "border-[#ffdc00]" : "border-transparent"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoSrcOf(record, index)} alt="" loading="lazy" className="size-full object-cover" />
                    {order >= 0 && (
                      <span className="absolute top-1 right-1 grid size-5 place-items-center rounded-full bg-[#ffdc00] text-[11px] font-bold text-black">
                        {order + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="mt-1 text-xs text-muted">保存した写真がないので、写真なしで共有します。</p>
          )}
        </div>

        <div>
          <p className="text-xs font-bold text-ink">投稿のプレビュー</p>
          <p className="mt-1 rounded-lg bg-background p-3 text-sm leading-6 break-words whitespace-pre-wrap text-ink">
            {preview.split("\n").map((line, i) => (
              <span key={i} className={line.startsWith("https://") ? "text-[#1d9bf0]" : undefined}>
                {line}
                {"\n"}
              </span>
            ))}
          </p>
          <p className={`mt-1 text-right text-xs tabular-nums ${over ? "font-bold text-red-600" : "text-muted"}`}>
            {length} / {X_LIMIT}
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {copied && <p className="text-center text-sm font-bold text-emerald-700">共有URLをコピーしました</p>}

        <button
          type="button"
          className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#0f1419] font-bold text-white disabled:opacity-60"
          disabled={busy || over}
          onClick={() => void share()}
        >
          {busy ? (
            "準備しています…"
          ) : mode === "x" ? (
            <>
              <XIcon className="mr-1.5 size-4" />
              Xで共有する
            </>
          ) : (
            <>
              <Share className="mr-1.5 size-4" />
              共有する
            </>
          )}
        </button>
      </div>
    </div>
  );
}
