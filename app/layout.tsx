import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "おく",
    template: "%s · おく",
  },
  description: "ヤフオクの出品を、終了前に自分のメモとして残すアプリ。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@500;600;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full bg-background text-foreground">
        <div className="mx-auto flex min-h-full max-w-3xl flex-col px-4 py-8 sm:px-6">
          <header className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium tracking-wide text-violet-ink">ヤフオク個人メモ</p>
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight text-violet-ink sm:text-4xl">
                おく
              </h1>
            </div>
            <a href="/" className="text-sm text-muted hover:text-violet-ink">
              ライブラリ
            </a>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="mt-12 border-t border-border pt-4 text-xs text-muted">
            個人利用向けのメモアプリです。Yahoo!オークション公式ではありません。
          </footer>
        </div>
      </body>
    </html>
  );
}
