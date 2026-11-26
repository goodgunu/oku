"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, Camera, History, JapaneseYen, NotebookPen, Store } from "lucide-react";
import { LandingLineFlow } from "@/components/landing-line-flow";
import { MockHeroCard, MockList, SAMPLE_ACTIVE, SamplePhoto } from "@/components/landing-mocks";
import { LoginOptions } from "@/components/login-options";
import { Wordmark } from "@/components/wordmark";
import { Reveal, Stagger } from "@/lib/motion";

const YELLOW = "#ffdc00";
const LINE_ACCOUNT_ID = "@916kdopz";
const LINE_FRIEND_URL = "https://line.me/R/ti/p/%40916kdopz";

const kept = [
  ["写真", "出品写真を手元に残す", Camera],
  ["価格・送料", "現在価格や即決価格、送料も", JapaneseYen],
  ["状態・詳細", "商品の状態、カテゴリ、終了日時", BadgeCheck],
  ["出品者情報", "出品者名や発送元の地域", Store],
  ["値下げ・終了の記録", "毎朝の自動確認で価格推移を記録", History],
  ["自分のメモ", "状態の確認結果や相場比較メモ", NotebookPen],
] as const;

const SITES = ["ヤフオク", "メルカリ", "PayPayフリマ", "ジモティー"] as const;

export function LandingPage() {
  const [url, setUrl] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [urlError, setUrlError] = useState("");

  useEffect(() => {
    const onOpen = () => setShowLogin(true);
    window.addEventListener("oku-open-login", onOpen);
    return () => window.removeEventListener("oku-open-login", onOpen);
  }, []);

  function openLogin(nextUrl?: string) {
    const pending = (nextUrl ?? url).trim();
    if (pending) {
      try {
        sessionStorage.setItem("oku-pending-url", pending);
      } catch {
        /* ignore */
      }
    }
    setShowLogin(true);
  }

  return (
    <div className="min-w-0 space-y-6" style={{ color: "#1C1917" }} data-wide-page>
      {/* ヒーロー（直接URL入力フォーム＋見本カード） */}
      <section
        className="overflow-hidden rounded-3xl border border-[#F3E5AB]"
        style={{ background: "#FFF8D6", color: "#1C1917" }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-7 sm:px-7 sm:py-10 lg:grid-cols-[minmax(0,1.12fr)_minmax(260px,0.88fr)] lg:gap-8">
          {/* 開いた時に、見出し→説明→フォームの順にふわっと出る */}
          <Stagger className="min-w-0">
            <p className="text-xs font-bold tracking-[0.12em]" style={{ color: "#B45309" }}>
              落札や掲載終了の前に · ヤフオク・メルカリ・PayPayフリマ・ジモティー対応
            </p>
            <h1 className="mt-2 text-[1.7rem] leading-snug font-extrabold tracking-tight text-ink sm:text-4xl">
              気になった出品を、
              <br />
              消える前に残す。
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-ink/85 sm:text-base">
              オークションやフリマの出品は、落札や掲載終了で見られなくなります。URLを残すと、価格も写真も、自分のアカウントに残ります。
            </p>
            <p className="mt-2.5 text-xs leading-6 font-medium sm:text-sm" style={{ color: "#92400E" }}>
              各サイトやアプリの共有から、LINEの「おく」に送っても残せます。
            </p>

            <form
              className="mt-5 rounded-2xl border border-[#E5C200] bg-white p-4 shadow-sm"
              noValidate
              onSubmit={(event) => {
                event.preventDefault();
                const value = url.trim();
                if (!value) {
                  setUrlError("URLを貼ってください");
                  document.getElementById("landing-url")?.focus();
                  return;
                }
                if (!/^https?:\/\//i.test(value)) {
                  setUrlError("「https://」から始まるURLを貼ってください");
                  document.getElementById("landing-url")?.focus();
                  return;
                }
                setUrlError("");
                openLogin(value);
              }}
            >
              <p className="text-xs leading-5 font-bold text-ink" data-landing="sites">
                対応サイト：{SITES.join("・")}
              </p>
              <label htmlFor="landing-url" className="mt-2 block text-xs font-bold text-muted">
                出品ページのURL
              </label>
              <input
                id="landing-url"
                value={url}
                onChange={(event) => {
                  setUrl(event.target.value);
                  if (urlError) setUrlError("");
                }}
                placeholder="https://… をここに貼る"
                className={`mt-1.5 w-full min-w-0 rounded-lg border bg-white px-3 py-3 text-base text-ink outline-none focus:ring-2 focus:ring-[#ffdc00] sm:text-sm ${
                  urlError ? "border-red-600 focus:border-red-600" : "border-border focus:border-ink"
                }`}
                inputMode="url"
                autoCapitalize="off"
                autoCorrect="off"
                aria-invalid={urlError ? true : undefined}
                aria-describedby={urlError ? "landing-url-error" : undefined}
              />
              {urlError ? (
                <p id="landing-url-error" role="alert" className="mt-1.5 text-xs font-bold text-red-700">
                  {urlError}
                </p>
              ) : null}
              <button
                type="submit"
                className="motion-press mt-2.5 w-full rounded-lg py-3 text-[15px] font-extrabold text-black shadow-xs hover:brightness-95"
                style={{ background: YELLOW }}
              >
                出品を残す
              </button>
              <p className="mt-2.5 text-[11px] leading-5 text-muted">
                タイトル、価格、写真、状態、出品者情報を読み取って保存します。
              </p>
            </form>
          </Stagger>

          <Reveal className="min-w-0" delay={180}>
            <MockHeroCard />
          </Reveal>
        </div>
      </section>

      {/* 毎日自動で確認。値下げもすぐわかる。 */}
      <section
        id="daily-check"
        className="overflow-hidden rounded-3xl border border-[#E5C200]"
        style={{ background: YELLOW, color: "#1C1917" }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:px-7 sm:py-10 lg:grid-cols-2 lg:gap-10">
          <Reveal className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.14em] text-black/75">毎日、自動でチェック</p>
            <h2 className="mt-2 text-[1.65rem] leading-snug font-extrabold tracking-tight text-black sm:text-4xl">
              毎日自動で確認。
              <br />
              値下げもすぐわかる。
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-black/85 sm:text-base">
              残した出品は、毎日自動でチェック。価格が下がると、一覧に「値下げ」と出ます。
            </p>
            <div
              className="mt-5 max-w-md rounded-2xl bg-white p-4 shadow-lg"
              style={{ color: "#1C1917" }}
              data-promo-line
            >
              <p className="flex items-center gap-2 text-base font-extrabold">
                <span
                  className="grid size-7 shrink-0 place-items-center rounded-full"
                  style={{ background: "#06C755" }}
                  aria-hidden
                >
                  <Image src="/icon-line.png" alt="" width={16} height={15} />
                </span>
                値下げや終了を、LINEでお知らせ
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "#57534E" }}>
                LINEで連携すると、お気に入りに登録した出品の値下げや落札・掲載終了が見つかった日に、LINEへお知らせが届きます（1日1通にまとめます）。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="/api/auth/line-login?next=%2F"
                  className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold text-white"
                  style={{ background: "#06C755" }}
                  onClick={() => {
                    const pending = url.trim();
                    if (pending) {
                      try {
                        sessionStorage.setItem("oku-pending-url", pending);
                      } catch {
                        /* ignore */
                      }
                    }
                  }}
                >
                  LINEで連携
                </a>
                <a
                  href={LINE_FRIEND_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center justify-center rounded-full border-2 px-4 text-sm font-bold"
                  style={{ borderColor: "#06C755", color: "#05813A" }}
                >
                  公式LINEを友だち追加
                </a>
              </div>
            </div>
          </Reveal>

          <Reveal className="min-w-0" variant="slide-right" delay={90}>
          <div
            className="relative mx-auto w-full max-w-sm min-w-0 overflow-hidden rounded-2xl bg-white shadow-lg lg:mx-0"
            style={{ color: "#1C1917" }}
            data-promo-card
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: "#C5C3BE" }}>
              <SamplePhoto />
              <span
                className="absolute top-2.5 left-2.5 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold text-black shadow"
                style={{ background: YELLOW }}
              >
                例
              </span>
            </div>
            <div className="border-t-2 p-4" style={{ borderTopColor: YELLOW }}>
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium" style={{ color: "#6B6560" }}>ヤフオク · {SAMPLE_ACTIVE.category}</p>
                <span className="text-[11px]" style={{ color: "#6B6560" }}>今日の確認</span>
              </div>
              <p className="mt-0.5 text-[16px] leading-snug font-bold text-ink">
                {SAMPLE_ACTIVE.titleShort}
              </p>
              <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-[11px] font-bold" style={{ color: "#6B6560" }}>{SAMPLE_ACTIVE.priceLabel}</span>
                <span
                  className="text-base font-bold tabular-nums line-through decoration-2"
                  style={{ color: "#9A948E" }}
                >
                  {SAMPLE_ACTIVE.previousPrice}
                </span>
                <span className="text-lg font-bold" style={{ color: "#B45309" }} aria-hidden>
                  →
                </span>
                <span className="text-[1.75rem] leading-none font-extrabold tabular-nums text-ink">
                  {SAMPLE_ACTIVE.priceNumber}<span className="text-sm font-bold text-ink">円</span>
                </span>
              </div>
              <p
                className="mt-3 inline-flex items-center rounded-full px-3 py-1 text-sm font-bold"
                style={{ background: "#E7F6EC", color: "#05813A" }}
              >
                {SAMPLE_ACTIVE.dropLabel}
              </p>
              <p className="mt-2.5 text-[11px] leading-5" style={{ color: "#6B6560" }}>
                ※ 表示のイメージです。実際の金額ではありません。
              </p>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ログイン・新規登録モーダル */}
      {showLogin && (
        <div
          className="motion-crossfade fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowLogin(false);
          }}
        >
          <Reveal variant="fade-up" className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
            <p className="text-xs font-bold tracking-[0.14em]" style={{ color: "#B45309" }}>
              ログイン・新規登録
            </p>
            <h2 className="mt-1 text-lg font-bold text-ink">おくをはじめる</h2>
            <p className="mt-1 mb-4 text-xs leading-5 text-muted">
              はじめての方は、そのまま登録されます。登録済みの方はそのままログインできます。
            </p>
            <LoginOptions />
            <button
              type="button"
              className="mt-3 w-full text-xs text-muted hover:text-ink"
              onClick={() => setShowLogin(false)}
            >
              閉じる
            </button>
          </Reveal>
        </div>
      )}

      {/* アカウントに残るもの（6カード） */}
      <section className="rounded-3xl border border-[#F3E5AB] px-4 py-8 sm:px-7" style={{ background: "#FFF8D6" }}>
        <div className="mx-auto max-w-6xl">
          <h2 className="text-lg font-bold text-ink">アカウントに残るもの</h2>
          <Stagger as="ul" className="mt-3 grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
            {kept.map(([title, body, Icon]) => (
              <li
                key={title}
                className="min-w-0 rounded-2xl border bg-white p-3.5 shadow-sm sm:p-4"
                style={{ borderColor: "#F3E5AB" }}
              >
                <span
                  className="grid size-9 place-items-center rounded-xl text-black"
                  style={{ background: YELLOW }}
                >
                  <Icon className="size-[18px]" aria-hidden />
                </span>
                <p className="mt-2.5 text-sm font-bold text-ink">{title}</p>
                <p className="mt-1 text-xs leading-5" style={{ color: "#6B6560" }}>
                  {body}
                </p>
              </li>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 残る（出品中 → 落札・掲載終了） */}
      <section
        id="after"
        className="rounded-3xl border border-border px-4 pt-6 pb-7 sm:px-7"
        style={{ background: "#FAF7F2" }}
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="max-w-md min-w-0">
            <h2 className="text-lg font-bold text-ink">残る</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              落札や削除で出品が終わっても、アカウントに残る。自分のメモも書ける。
            </p>
            <MockList />
          </Reveal>
        </div>
      </section>

      {/* 使い方（LINEの4ステップ） */}
      <div className="overflow-hidden rounded-3xl border border-border">
        <LandingLineFlow />
      </div>

      {/* 下部 LINE友だち追加 CTA */}
      <section className="rounded-3xl border border-[#CBEFD8]" style={{ background: "#E7F6EC" }}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-7">
          <Reveal>
            <h2 className="text-lg font-bold text-ink">LINEに送ると、その場で残る</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-muted">
              下のボタンで公式LINE「おく」を友だち追加します。IDは {LINE_ACCOUNT_ID} です。追加したあと、各サイトの共有から「おく」を選ぶと、アカウントに保存されます。
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <a
                href={LINE_FRIEND_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#06C755] px-6 text-sm font-bold text-white shadow-xs hover:opacity-95"
              >
                <Image src="/icon-line.png" alt="" width={20} height={19} />
                公式LINE「おく」を友だち追加（{LINE_ACCOUNT_ID}）
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* フッター */}
      <footer className="rounded-2xl px-4 pt-4 pb-3 sm:px-7" style={{ background: YELLOW, color: "#111111" }}>
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="shrink-0">
              <Wordmark height={24} />
            </span>
            <p className="text-xs font-medium text-black/80">気になる出品を、いつでも見返せる場所。</p>
            <span className="flex-1" />
            <nav className="-mx-2 flex flex-wrap" aria-label="規約">
              <Link href="/privacy" className="inline-flex min-h-11 items-center px-2 text-sm font-bold underline underline-offset-4">
                プライバシーポリシー
              </Link>
              <Link href="/terms" className="inline-flex min-h-11 items-center px-2 text-sm font-bold underline underline-offset-4">
                利用規約
              </Link>
            </nav>
          </div>
          <p className="mt-1 text-xs leading-5 text-black/75" data-landing="disclaimer">
            おくは個人が運営するサービスで、ヤフオク・メルカリ・PayPayフリマ・ジモティーなど各サイトの公式サービスではありません。出品の文章と写真の権利は、出品者と各サイトにあります。
          </p>
        </div>
      </footer>
    </div>
  );
}
