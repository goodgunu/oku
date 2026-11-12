"use client";

import { useEffect, useState } from "react";

export const HEADER_PILL =
  "inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-bold leading-none";

type LinksResponse = {
  line?: boolean;
  canLinkLine?: boolean;
};

export function ConnectBadges() {
  const [lineLinked, setLineLinked] = useState<boolean | null>(null);
  const [canLinkLine, setCanLinkLine] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/links", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<LinksResponse>) : null))
      .then((data) => {
        if (cancelled || !data) return;
        setLineLinked(Boolean(data.line));
        setCanLinkLine(Boolean(data.canLinkLine));
      })
      .catch(() => {
        // ignore
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function linkLine() {
    const here = `${window.location.pathname}${window.location.search}`;
    const next = here.startsWith("/sso-callback") ? "/" : here;
    window.location.href = `/api/auth/line-login?link=1&next=${encodeURIComponent(next)}`;
  }

  return (
    <div className="flex items-center gap-1.5">
      {lineLinked === true && (
        <span
          className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold text-white"
          style={{ background: "#06C755" }}
          title="LINEと連携済みです"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-line.png" alt="" width={14} height={14} className="size-3.5" />
          LINE連携済み
        </span>
      )}
      {lineLinked === false && canLinkLine && (
        <button
          type="button"
          onClick={linkLine}
          className="inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-[11px] font-bold text-white shadow-xs hover:opacity-95"
          style={{ background: "#06C755" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-line.png" alt="" width={16} height={16} className="size-4" />
          LINE連携
        </button>
      )}
    </div>
  );
}
