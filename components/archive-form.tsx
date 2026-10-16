"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ArchiveResponse = {
  status: "ok" | "ended" | "error";
  message?: string;
  record?: { id: string; title: string };
};

export function ArchiveForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ url }),
        cache: "no-store",
      });
      const data = (await response.json()) as ArchiveResponse;
      if (data.status === "error") {
        setError(data.message || "保存できませんでした。");
        return;
      }
      const note = data.status === "ended" ? "（終了済みとして保存）" : "";
      setMessage(`保存しました${note}: ${data.record?.title || data.record?.id}`);
      setUrl("");
      router.refresh();
      if (data.record?.id) {
        router.push(`/listings/${data.record.id}`);
      }
    } catch {
      setError("通信に失敗しました。もう一度試してください。");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <label htmlFor="yahoo-url" className="mb-2 block text-sm font-bold text-ink">
        出品ページのURL
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
        <input
          id="yahoo-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ヤフオク・PayPayフリマ・ジモティー・メルカリのURL"
          className="min-w-0 flex-1 rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-yahoo"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-yahoo px-6 py-2.5 text-sm font-bold text-ink hover:bg-yahoo-deep disabled:opacity-60"
        >
          {busy ? "おくっています…" : "おく"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm font-medium text-live">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-ended">{error}</p>}
      <p className="mt-3 text-xs leading-relaxed text-muted">
        出品が生きているうちにURLを貼ると、タイトル・価格・写真などをメモとして残します。対応: ヤフオク・PayPayフリマ・ジモティー・メルカリ（メルカリは読み取れないとき、タイトルと写真のみ）。
      </p>
    </form>
  );
}
