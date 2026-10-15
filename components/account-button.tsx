"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";

export function AccountButton() {
  const { isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [notice, setNotice] = useState("");
  if (!isSignedIn) return null;
  const hasLine = (user?.externalAccounts || []).some((a) => String(a.provider) === "line" || String(a.provider) === "oauth_line");

  async function linkLine() {
    setNotice("");
    try {
      const account = await user?.createExternalAccount({ strategy: "oauth_line", redirectUrl: "/" });
      const url = account?.verification?.externalVerificationRedirectURL;
      if (url) window.location.href = url.toString();
      else setNotice("LINEを開けませんでした。");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "LINEを開けませんでした。");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {notice && <span className="text-xs text-red-700">{notice}</span>}
      {!hasLine && (
        <button
          type="button"
          onClick={() => void linkLine()}
          className="rounded-full bg-[#06C755] px-3 py-1 text-xs font-bold text-white"
        >
          LINEを連携
        </button>
      )}
      <button
        type="button"
        onClick={() => void signOut({ redirectUrl: "/" })}
        className="rounded-full border border-black/30 px-3 py-1 text-xs font-bold text-ink"
      >
        ログアウト
      </button>
    </div>
  );
}
