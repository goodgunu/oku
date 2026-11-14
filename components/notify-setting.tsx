"use client";

import { useEffect, useState } from "react";

type State = {
  loading: boolean;
  enabled: boolean;
  lineLinked: boolean;
  saving: boolean;
};

export function NotifySettingCard() {
  const [state, setState] = useState<State>({
    loading: true,
    enabled: true,
    lineLinked: false,
    saving: false,
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notify", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { enabled?: boolean; lineLinked?: boolean } | null) => {
        if (cancelled || !data) return;
        setState({
          loading: false,
          enabled: data.enabled ?? true,
          lineLinked: Boolean(data.lineLinked),
          saving: false,
        });
      })
      .catch(() => {
        if (!cancelled) setState((s) => ({ ...s, loading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function toggle() {
    const next = !state.enabled;
    setState((s) => ({ ...s, enabled: next, saving: true }));
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) {
        const data = (await res.json()) as { enabled: boolean; lineLinked: boolean };
        setState({ loading: false, enabled: data.enabled, lineLinked: data.lineLinked, saving: false });
      } else {
        setState((s) => ({ ...s, enabled: !next, saving: false }));
      }
    } catch {
      setState((s) => ({ ...s, enabled: !next, saving: false }));
    }
  }

  return (
    <section
      aria-label="LINEでのお知らせ設定"
      className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:px-5"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
            style={{ background: "#06C755" }}
          >
            LINE通知
          </span>
          <h3 className="text-sm font-bold text-ink">値下げ・終了をLINEでお知らせ</h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-muted">
          お気に入りに登録した出品が値下げされたり、出品終了になったとき、1日1通にまとめてLINEでお知らせします。
        </p>
      </div>

      {state.loading ? (
        <span className="shrink-0 text-xs text-muted">読み込み中…</span>
      ) : !state.lineLinked ? (
        <a
          href="/api/auth/line-login?link=1&next=%2F"
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold text-white shadow-xs"
          style={{ background: "#06C755" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-line.png" alt="" width={18} height={18} className="size-4" />
          LINEで受け取る
        </a>
      ) : (
        <button
          type="button"
          role="switch"
          aria-checked={state.enabled}
          disabled={state.saving}
          onClick={() => void toggle()}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-border px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 sm:self-center"
          style={
            state.enabled
              ? { background: "#EAFBF0", borderColor: "#06C755", color: "#057A35" }
              : { background: "#F4F4F5", color: "#52525B" }
          }
        >
          <span
            className="size-2.5 rounded-full"
            style={{ background: state.enabled ? "#06C755" : "#A1A1AA" }}
          />
          {state.enabled ? "お知らせ ON" : "お知らせ OFF"}
        </button>
      )}
    </section>
  );
}
