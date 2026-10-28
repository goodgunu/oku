"use client";

import Image from "next/image";
import Link from "next/link";
import { LandingLineFlow } from "@/components/landing-line-flow";
import { MockHeroCard, MockList } from "@/components/landing-mocks";

const LINE_FRIEND_URL = "https://line.me/R/ti/p/%40916kdopz";

function openLoginModal() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("oku-open-login"));
  }
}

export function LandingPage() {
  return (
    <div className="space-y-8">
      {/* ヒーロー */}
      <section className="rounded-3xl border border-[#ffdc00] bg-gradient-to-b from-[#fff8d6] to-white px-5 py-7 sm:px-8 sm:py-10">
        <div className="grid items-center gap-6 md:grid-cols-[1.08fr_0.92fr] md:gap-8">
          <div>
            <p className="text-xs font-bold tracking-wider text-ink/80">
              ヤフオク · PayPayフリマ · ジモティー · メルカリ対応
            </p>
            <h1 className="mt-1.5 text-[1.65rem] font-extrabold leading-[1.25] tracking-tight text-ink sm:text-4xl">
              気になる出品を、
              <br />
              消える前に残す。
            </h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-ink/80">
              オークションやフリマの出品は、落札や掲載終了で見られなくなります。おくに送っておけば、写真も価格も自分のアカウントに残せます。
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={openLoginModal}
                className="h-11 rounded-full bg-[#ffdc00] px-6 text-sm font-bold text-black shadow-sm hover:bg-[#f5c400]"
              >
                はじめる（無料）
              </button>
              <a
                href={LINE_FRIEND_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center gap-1.5 rounded-full bg-[#06C755] px-5 text-sm font-bold text-white shadow-sm hover:opacity-95"
              >
                <Image src="/icon-line.png" alt="" width={20} height={19} />
                LINEの友だち追加
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">
              登録は30秒 · スマホでもパソコンでも同じ一覧を見られます
            </p>
          </div>
          <MockHeroCard />
        </div>
      </section>

      {/* アピール（毎日自動確認・値下げ・LINE通知） */}
      <section aria-label="おくの特徴">
        <div className="grid gap-3.5 md:grid-cols-2" data-promo-line>
          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 sm:p-5" data-promo-card>
            <div>
              <span className="inline-block rounded-full bg-[#ffdc00] px-2.5 py-0.5 text-[11px] font-bold text-black">
                自動でチェック
              </span>
              <h2 className="mt-2 text-base font-extrabold leading-snug text-ink sm:text-lg">
                毎日自動で出品を確認
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                保存した出品のページを、おくが毎日ひとりでに確認します。いちいち自分で開き直す必要はありません。
              </p>
            </div>
            <div className="mt-3.5 rounded-xl bg-[#fff8d6] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-ink">値下げがあればすぐわかる</span>
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  5,000円値下げ
                </span>
              </div>
              <p className="mt-1 text-xs font-bold tabular-nums text-muted">
                253,000円 → <span className="text-emerald-700">248,000円</span>（保存時からの差額を表示）
              </p>
            </div>
          </div>

          <div
            className="flex flex-col justify-between rounded-2xl border-2 border-[#06C755] bg-[#F2FBF5] p-4 sm:p-5"
            data-promo-card
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-[#06C755]">
                  <Image src="/icon-line.png" alt="" width={16} height={15} />
                </span>
                <span className="rounded-full bg-[#06C755] px-2.5 py-0.5 text-[11px] font-bold text-white">
                  LINEでお知らせ
                </span>
              </div>
              <h2 className="mt-2 text-base font-extrabold leading-snug text-ink sm:text-lg">
                値下げや終了を、LINEでお知らせ
              </h2>
              <p className="mt-1 text-xs leading-5 text-muted">
                値段が下がったときや、落札・掲載終了になったときは、夜にまとめて1回だけLINEでお知らせします。
              </p>
            </div>
            <div className="mt-3.5 rounded-xl border border-[#CBEFD8] bg-white p-3 text-xs leading-5">
              <p className="font-bold text-[#057A35]">おくからのお知らせ（10月28日）</p>
              <p className="mt-0.5 text-ink">【値下げ】1件 · SONY α7 IV（5,000円値下げ）</p>
              <p className="text-muted">【終了】1件 · MacBook Air M3（162,000円）</p>
              <p className="mt-1.5 text-[11px] text-muted">
                公式LINEを友だち追加して連携すると届きます（いつでもオフにできます）
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 残るデモ */}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <div className="grid items-center gap-6 md:grid-cols-[0.95fr_1.05fr]">
          <div>
            <p className="text-xs font-bold text-ink/70">おくがいちばん役に立つとき</p>
            <h2 className="mt-1 text-lg font-extrabold leading-snug text-ink sm:text-xl">
              出品が終わっても、
              <br />
              あなたの手元には残る
            </h2>
            <p className="mt-2 text-xs leading-6 text-muted sm:text-sm">
              元のサイトで落札・削除されても、保存したときの写真・価格・説明・自分のメモは消えません。相場を比べたり、出品者とやり取りするときの控えになります。
            </p>
          </div>
          <MockList />
        </div>
      </section>

      {/* 使い方（LINEの4ステップ） */}
      <section id="how" className="scroll-mt-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-bold text-[#06C755]">いちばんかんたんな残し方</p>
            <h2 className="mt-0.5 text-lg font-extrabold text-ink sm:text-xl">
              出品ページから、LINEに送るだけ
            </h2>
          </div>
          <p className="text-xs text-muted">URLをコピーして画面に貼る方法でも残せます</p>
        </div>

        <LandingLineFlow />

        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl border border-[#ffdc00] bg-[#fff8d6] p-4 sm:flex-row sm:items-center sm:px-5">
          <div>
            <p className="text-sm font-bold text-ink">公式LINE「おく」（@916kdopz）</p>
            <p className="mt-0.5 text-xs text-ink/80">
              友だち追加して最初の1回だけログインすると、次からはURLを送るだけで自分のライブラリに保存されます。
            </p>
          </div>
          <a
            href={LINE_FRIEND_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#06C755] px-5 text-xs font-bold text-white shadow-xs hover:opacity-95"
          >
            <Image src="/icon-line.png" alt="" width={18} height={17} />
            友だち追加する
          </a>
        </div>
      </section>

      <footer className="border-t border-border pt-5 text-center text-xs text-muted">
        <p>おく — 出品の個人メモ</p>
        <p className="mt-2 flex justify-center gap-4">
          <Link href="/terms" className="underline">利用規約</Link>
          <Link href="/privacy" className="underline">プライバシーポリシー</Link>
        </p>
      </footer>
    </div>
  );
}
