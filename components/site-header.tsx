"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountButton } from "@/components/account-button";
import { Wordmark } from "@/components/wordmark";

const PILL =
  "h-7 shrink-0 items-center whitespace-nowrap rounded-full border border-black/20 bg-black/[0.05] px-2.5 text-[11px] font-bold leading-none text-ink hover:bg-black/10";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);
  const [clerkActive, setClerkActive] = useState(false);

  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email?: string | null; clerkActive?: boolean } | null) => {
        setSignedIn(Boolean(d?.email));
        setClerkActive(Boolean(d?.clerkActive));
      })
      .catch(() => {});
  }, []);

  return (
    <header className="border-b border-black/10 bg-yahoo">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <Link href="/" aria-label="おく ホーム" className="shrink-0">
          <Wordmark height={32} />
        </Link>
        {signedIn ? (
          <div className="flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2">
            <p className="hidden text-xs font-medium text-black/70 sm:block">出品の個人メモ</p>
            <Link href="/" className={`inline-flex ${PILL}`}>
              保存した出品
            </Link>
            <Link href="/compare" className={`hidden sm:inline-flex ${PILL}`}>
              比較
            </Link>
            <AccountButton signedIn={signedIn} clerkActive={clerkActive} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
