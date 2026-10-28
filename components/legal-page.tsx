import Link from "next/link";
import { LEGAL_UPDATED } from "@/lib/legal";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex h-8 items-center rounded-full border border-border bg-card px-3.5 text-xs font-bold text-ink hover:bg-background"
        >
          ← トップへ戻る
        </Link>
        <span className="text-xs text-muted">最終更新日: {LEGAL_UPDATED}</span>
      </div>
      <div className="space-y-5 rounded-2xl border border-border bg-card p-5 text-sm leading-7 text-ink shadow-xs sm:p-7">
        <h1 className="text-xl font-bold text-ink sm:text-2xl">{title}</h1>
        {children}
      </div>
    </div>
  );
}
