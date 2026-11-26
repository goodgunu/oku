"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountButton } from "@/components/account-button";
import { Wordmark } from "@/components/wordmark";
import { guardOnceClick } from "@/lib/once-click";

const PILL =
  "h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-black/20 bg-black/[0.05] px-3.5 text-xs font-bold leading-none text-ink hover:bg-black/10";

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

function SignedOutNav({ placeholder = false }: { placeholder?: boolean }) {
  return (
    <nav
      className={`flex shrink-0 items-center gap-1.5 sm:gap-2${placeholder ? " invisible" : ""}`}
      aria-label={placeholder ? undefined : "ログイン"}
      aria-hidden={placeholder ? true : undefined}
      inert={placeholder ? true : undefined}
    >
      <Link
        href="/#how"
        className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-black/20 bg-black/[0.05] px-2.5 text-xs font-bold leading-none text-ink hover:bg-black/10 sm:px-3.5"
      >
        使い方
      </Link>
      <a
        href="/api/auth/line-login?next=%2F"
        className="inline-flex h-11 shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-bold text-white shadow-xs sm:gap-1.5 sm:px-4 sm:text-sm"
        style={{ background: "#06C755" }}
        data-control="header-line"
        onClick={(event) => {
          if (!guardOnceClick(event)) return;
          savePendingUrl();
        }}
      >
        <Image src="/icon-line.png" alt="" width={14} height={14} />
        LINEではじめる
      </a>
      <button
        type="button"
        className="inline-flex h-11 shrink-0 items-center whitespace-nowrap rounded-full border border-black/15 bg-white px-2.5 text-xs font-extrabold text-black shadow-xs hover:bg-white/90 sm:px-4 sm:text-sm"
        data-control="header-other"
        onClick={() => {
          savePendingUrl();
          const inline = document.getElementById("login-options");
          if (inline) {
            inline.scrollIntoView({ behavior: "smooth", block: "center" });
          } else if (document.querySelector("[data-wide-page]")) {
            window.dispatchEvent(new Event("oku-open-login"));
          } else {
            window.location.assign("/");
          }
        }}
      >
        <span className="sm:hidden">ほかの方法</span>
        <span className="hidden sm:inline">メール・Googleなど</span>
      </button>
    </nav>
  );
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
      <div className="site-shell mx-auto flex min-h-15 max-w-4xl items-center justify-between gap-2 px-3 py-2 sm:gap-4 sm:px-6">
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
        ) : (
          // 確認中（null）も同じ幅・高さの枠を見えない状態で置いておき、
          // ログイン確認が終わった時にヘッダーの高さや並びがずれないようにする
          <SignedOutNav placeholder={signedIn === null} />
        )}
      </div>
    </header>
  );
}
