import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ページが見つかりません",
  robots: { index: false, follow: false },
};

// サイト全体の404（存在しない共有URL /s/… や出品の詳細もここに来る）
export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-1 py-14 text-center sm:py-20">
      <p className="text-sm font-bold tracking-[0.14em]" style={{ color: "#B45309" }}>
        404
      </p>
      <h1 className="mt-2 text-2xl leading-snug font-bold text-ink sm:text-3xl">ページが見つかりません</h1>
      <p className="mt-3 text-left text-sm leading-7 sm:text-center" style={{ color: "#57534E" }}>
        URLが間違っているか、共有が止められた可能性があります。トップページからもう一度お試しください。
      </p>
      <Link
        href="/"
        className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-yahoo px-8 text-base font-bold text-black shadow-xs hover:bg-yahoo-deep"
      >
        トップへ戻る
      </Link>
      <nav className="mt-8 flex text-xs text-muted" aria-label="規約">
        <Link href="/privacy" className="inline-flex min-h-11 items-center px-2 underline underline-offset-2">
          プライバシーポリシー
        </Link>
        <Link href="/terms" className="inline-flex min-h-11 items-center px-2 underline underline-offset-2">
          利用規約
        </Link>
      </nav>
    </div>
  );
}
