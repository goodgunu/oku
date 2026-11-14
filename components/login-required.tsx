import Link from "next/link";
import { LoginRequiredOptions } from "@/components/login-required-options";
import { clerkEnabled } from "@/lib/account";

/**
 * トップ以外のログインが必要なページ（出品の詳細・比較など）を、未ログインで開いたときの案内。
 * のこすの「ログインすると見られます」画面にそろえている。
 */
export function LoginRequired() {
  return (
    <div className="mx-auto w-full max-w-sm py-6 sm:py-10" data-page="login-required">
      <p className="text-xs font-bold tracking-[0.14em]" style={{ color: "#B45309" }}>
        ログインが必要です
      </p>
      <h1 className="mt-2 text-2xl leading-snug font-bold text-ink">ログインすると見られます</h1>
      <p className="mt-2 mb-6 text-sm leading-7" style={{ color: "#57534E" }}>
        このページは、出品を保存した本人だけが開けます。保存したときと同じ方法でログインしてください。はじめての方は、そのまま登録できます。
      </p>
      <div id="login-options" className="scroll-mt-24">
        <LoginRequiredOptions clerk={clerkEnabled()} />
      </div>
      <Link
        href="/"
        className="mt-4 flex h-11 w-full items-center justify-center rounded-full text-sm font-bold text-ink underline-offset-4 hover:underline"
      >
        トップへ戻る
      </Link>
      <p className="mt-2 text-center text-xs leading-5 text-muted">
        続けると、
        <Link href="/terms" className="underline">
          利用規約
        </Link>
        と
        <Link href="/privacy" className="underline">
          プライバシーポリシー
        </Link>
        に同意したものとみなします。
      </p>
    </div>
  );
}
