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
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <label htmlFor="yahoo-url" className="mb-2 block text-sm font-medium text-violet-ink">
        ヤフオクの出品URL
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id="yahoo-url"
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://auctions.yahoo.co.jp/jp/auction/…"
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none ring-violet/30 focus:ring-2"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-violet px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-ink disabled:opacity-60"
        >
          {busy ? "おくっています…" : "おく"}
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-live">{message}</p>}
      {error && <p className="mt-3 text-sm text-ended">{error}</p>}
      <p className="mt-3 text-xs text-muted">
        出品が生きているうちにURLを貼ると、タイトル・価格・写真などをメモとして残します。
      </p>
    </form>
  );
}
