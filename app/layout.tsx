import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import Link from "next/link";
import { AccountButton } from "@/components/account-button";
import { clerkEnabled } from "@/lib/account";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "おく",
    template: "%s · おく",
  },
  description: "ヤフオクの出品を、終了前に自分のメモとして残すアプリ。",
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const enabled = clerkEnabled();
  const page = (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <header className="border-b border-black/10 bg-yahoo">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <Link href="/" className="flex items-center gap-2" aria-label="おく ホーム">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-crop.png"
                alt="おく"
                className="h-9 w-auto sm:h-11"
                width={409}
                height={164}
              />
            </Link>
            <div className="flex items-center gap-3">
              <p className="hidden text-xs font-medium text-ink/70 sm:block">ヤフオク個人メモ</p>
              {enabled && <AccountButton />}
            </div>
          </div>
        </header>
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-8">
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
  return enabled ? <ClerkProvider localization={jaJP}>{page}</ClerkProvider> : page;
}
