"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountButton } from "@/components/account-button";
import { Wordmark } from "@/components/wordmark";

const PILL =
  "h-7 shrink-0 items-center whitespace-nowrap rounded-full border border-black/20 bg-black/[0.05] px-2.5 text-[11px] font-bold leading-none text-ink hover:bg-black/10";

function savePendingUrl() {
  const input = document.getElementById("landing-url") as HTMLInputElement | null;
  const pending = input?.value.trim();
  if (!pending) return;
  try {
    sessionStorage.setItem("oku-pending-url", pending);
  } catch {
    /* ignore */
  }
}

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [clerkActive, setClerkActive] = useState(false);

  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email?: string | null; clerkActive?: boolean } | null) => {
        setSignedIn(Boolean(d?.email));
        setClerkActive(Boolean(d?.clerkActive));
      })
      .catch(() => setSignedIn(false));
  }, []);

  return (
    <header className="border-b border-black/10 bg-yahoo">
      <div className="site-shell mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" aria-label="おく ホーム" className="shrink-0">
          <Wordmark height={30} />
        </Link>
        {signedIn === true ? (
          <div className="flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <p className="hidden text-xs font-medium text-black/70 sm:block">出品の個人メモ</p>
            <Link href="/compare" className={`hidden sm:inline-flex ${PILL}`}>
              比較
            </Link>
            <AccountButton signedIn={signedIn} clerkActive={clerkActive} />
          </div>
        ) : signedIn === false ? (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              href="/api/auth/line-login?next=%2F"
              className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-bold text-white shadow-xs"
              style={{ background: "#06C755" }}
              onClick={savePendingUrl}
            >
              <Image src="/icon-line.png" alt="" width={14} height={14} />
              LINEで連携
            </a>
            <button
              type="button"
              className="shrink-0 whitespace-nowrap rounded-full border border-black/15 bg-white px-4 py-1.5 text-xs font-extrabold text-black shadow-xs hover:bg-white/90"
              onClick={() => {
                savePendingUrl();
                window.dispatchEvent(new Event("oku-open-login"));
              }}
            >
              はじめる
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
