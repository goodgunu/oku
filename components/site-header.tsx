"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountButton } from "@/components/account-button";
import { ConnectBadges } from "@/components/connect-badges";

export function SiteHeader() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    fetch("/api/auth", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { email?: string | null } | null) => {
        setSignedIn(Boolean(d?.email));
      })
      .catch(() => {});
  }, []);

  return (
    <header className="border-b-4 border-yahoo-deep bg-yahoo">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-black">
          <Image src="/icon.png" alt="" width={28} height={28} className="rounded-md" />
          おく
        </Link>
        {signedIn ? (
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/compare"
              className="hidden rounded-full border border-black/20 bg-white/85 px-3 py-1 text-xs font-bold text-ink hover:bg-white sm:inline-flex"
            >
              比較
            </Link>
            <ConnectBadges />
            <AccountButton />
          </div>
        ) : null}
      </div>
    </header>
  );
}
