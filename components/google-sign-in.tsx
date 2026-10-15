"use client";

import { useSignIn } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { externalBrowserUrl, isLineInApp } from "@/lib/in-app-browser";

export function GoogleSignIn({ linking = false }: { linking?: boolean }) {
  const { signIn, fetchStatus } = useSignIn();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [inLine, setInLine] = useState(false);
  const [stuck, setStuck] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ready = fetchStatus !== "fetching";

  useEffect(() => {
    setInLine(isLineInApp(navigator.userAgent));
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function stopTimer() {
    if (timer.current) clearTimeout(timer.current);
  }

  function openExternal() {
    window.location.href = externalBrowserUrl(window.location.href);
  }

  async function start(strategy: "oauth_google" | "oauth_line") {
    if (!ready || busy) return;
    const label = strategy === "oauth_line" ? "LINE" : "Google";
    setBusy(true);
    setNotice("");
    setStuck(false);
    // アプリ内ブラウザで画面が動かないときの保険（5秒たっても移動しなければ案内を出す）
    stopTimer();
    timer.current = setTimeout(() => {
      setBusy(false);
      setStuck(true);
    }, 5000);
    try {
      const here = `${window.location.pathname}${window.location.search}`;
      const result = await signIn.sso({
        strategy,
        redirectUrl: here.startsWith("/sso-callback") ? "/" : here,
        redirectCallbackUrl: "/sso-callback",
        ...(strategy === "oauth_google" ? { oidcPrompt: "select_account" as const } : {}),
      });
      if (result.error) {
        stopTimer();
        setBusy(false);
        setNotice(result.error.message || `${label}のログインを開始できませんでした。`);
      }
    } catch (error) {
      stopTimer();
      setBusy(false);
      setNotice(error instanceof Error ? error.message : `${label}のログインを開始できませんでした。`);
    }
  }

  const lineButton = (
    <button
      type="button"
      onClick={() => void start("oauth_line")}
      disabled={!ready || busy}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-[#06C755] text-base font-bold text-white shadow-sm disabled:opacity-60"
    >
      {busy ? "開いています" : "LINEで続ける"}
    </button>
  );
  const googleButton = (
    <button
      type="button"
      onClick={() => void start("oauth_google")}
      disabled={!ready || busy}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-full bg-yahoo text-base font-bold text-black shadow-sm disabled:opacity-60"
    >
      Googleで続ける
    </button>
  );

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-bold text-ink">{linking ? "LINEとつなぐ" : "ログイン"}</h1>
      <p className="text-sm leading-relaxed text-muted">
        {linking
          ? "最初の1回だけ、ログインしてLINEの「おく」とつなぎます。次からは、URLを送るだけで保存されます。"
          : "ログインすると、スマホでもパソコンでも同じライブラリが見えます。"}
      </p>
      {inLine ? (
        <>
          {lineButton}
          <p className="text-sm text-muted">LINEアプリ内ではLINEでログインしてください</p>
        </>
      ) : (
        <>
          {googleButton}
          {lineButton}
        </>
      )}
      {notice && <p className="text-sm text-red-600">{notice}</p>}
      {stuck && (
        <div className="space-y-2 text-sm text-muted">
          <p>画面が切り替わらないときは、ふだんのブラウザで開いてください。</p>
          <button type="button" onClick={openExternal} className="h-10 w-full rounded-full border border-border font-bold text-ink">
            ブラウザで開く
          </button>
        </div>
      )}
    </div>
  );
}
