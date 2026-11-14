import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";
import { AuthNotice } from "@/components/auth-notice";
import { SiteHeader } from "@/components/site-header";
import { clerkEnabled } from "@/lib/account";
import "./globals.css";

const SITE_URL = "https://oku-bice.vercel.app";
const SITE_TITLE = "おく｜気になった出品を、消える前に残す";
const SITE_DESCRIPTION =
  "ヤフオク・メルカリ・PayPayフリマ・ジモティーの出品を、落札や掲載終了で消える前に自分のアカウントへ残すメモ。URLを貼るか、LINEの「おく」に送るだけ。値下げや終了はLINEでお知らせします。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · おく",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "おく",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [{ url: "/favicon.png", type: "image/png" }, { url: "/icon.png", type: "image/png" }],
    apple: "/icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const enabled = clerkEnabled();
  const inner = (
    <>
      <AuthNotice />
      <SiteHeader />
      <div className="site-shell mx-auto flex min-h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 py-6 sm:px-6 sm:py-8">
        <main className="min-w-0 w-full flex-1">{children}</main>
      </div>
    </>
  );
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full overflow-x-hidden bg-background text-foreground">
        {enabled ? (
          <ClerkProvider
            localization={jaJP}
            signInUrl="/"
            signUpUrl="/"
            signInForceRedirectUrl="/"
            signUpForceRedirectUrl="/"
            signInFallbackRedirectUrl="/"
            signUpFallbackRedirectUrl="/"
          >
            {inner}
          </ClerkProvider>
        ) : (
          inner
        )}
      </body>
    </html>
  );
}
