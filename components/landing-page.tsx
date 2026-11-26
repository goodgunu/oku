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
import { guardOnceClick } from "@/lib/once-click";

const YELLOW = "#ffdc00";
const LINE_ACCOUNT_ID = "@916kdopz";
const LINE_FRIEND_URL = "https://line.me/R/ti/p/%40916kdopz";

const kept = [
  ["写真", "出品写真を手元に残す", Camera],
  ["価格・送料", "現在価格や即決価格、送料も", JapaneseYen],
  ["状態・詳細", "商品の状態、カテゴリ、終了日時", BadgeCheck],
  ["出品者情報", "出品者名や発送元の地域", Store],
  ["価格推移・最終価格", "毎朝の自動確認で値下げ・アップ・最終価格を記録", History],
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
          {/*
            見出しと説明（LCP 要素の説明文を含む先頭 4 件）は最初の描画からそのまま見せ、
            フォームだけ開いた瞬間にふわっと出す（immediate なので「見えたら」を待たない）
          */}
          <Stagger className="min-w-0" immediate skip={4}>
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
            <div className="mt-4 flex flex-wrap items-center gap-2.5">
              <a
                href="/api/auth/line-login?next=%2F"
                className="motion-press inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-extrabold text-white shadow-sm hover:opacity-95"
                style={{ background: "#06C755" }}
                onClick={(event) => {
                  if (!guardOnceClick(event)) return;
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
                <Image src="/icon-line.png" alt="" width={18} height={17} />
                LINEではじめる（無料）
              </a>
              <button
                type="button"
                onClick={() => openLogin()}
                className="inline-flex h-12 items-center justify-center rounded-full border border-black/15 bg-white px-4 text-xs font-bold text-ink hover:bg-white/90 sm:text-sm"
              >
                メール・Googleなど
              </button>
            </div>
            <p className="mt-2 text-xs leading-5" style={{ color: "#92400E" }}>
              登録後に公式LINEの友だち追加と連携を案内します。下の欄にURLを貼って始めることもできます。
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

          <Reveal className="min-w-0" delay={180} immediate>
            <MockHeroCard />
          </Reveal>
        </div>
      </section>

      {/* 毎朝自動でチェック。価格の動きも残る。 */}
      <section
        id="daily-check"
        className="overflow-hidden rounded-3xl border border-[#E5C200]"
        style={{ background: YELLOW, color: "#1C1917" }}
      >
        <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 py-8 sm:px-7 sm:py-10 lg:grid-cols-2 lg:gap-10">
          <Reveal className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.14em] text-black/75">毎朝7時ごろに自動チェック</p>
            <h2 className="mt-2 text-[1.65rem] leading-snug font-extrabold tracking-tight text-black sm:text-4xl">
              毎朝自動でチェック。
              <br />
              価格の動きも残る。
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-black/85 sm:text-base">
              残した出品は毎朝1回、自動で状態を確認します。フリマの値下げだけでなく、ヤフオクの入札による価格アップや終了時の最終価格も履歴に残ります。
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
                お気に入りの値下げ・終了をLINEでお知らせ
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: "#57534E" }}>
                通知が届くのは<strong>お気に入り（♥）に登録した出品だけ</strong>です。値下げや終了が見つかった朝に、1日1通にまとめてLINEへ届きます（リアルタイム通知ではありません）。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href="/api/auth/line-login?next=%2F"
                  className="inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-bold text-white"
                  style={{ background: "#06C755" }}
                  onClick={(event) => {
                    if (!guardOnceClick(event)) return;
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
              下のボタンで公式LINE「おく」（{LINE_ACCOUNT_ID}）を友だち追加すると、各サイトの共有からURLを送って保存できます。アカウント未連携のままURLを送った場合も、その場で連携用の案内リンクが返信されるので、開くだけで登録と保存が完了します。
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

      {/* 料金・保存上限・保存期間 */}
      <section className="rounded-3xl border border-border bg-white px-4 py-6 sm:px-7">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-base font-bold text-ink">料金・保存について</h2>
          <dl className="mt-3 grid gap-3 text-xs leading-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-[#FAF7F2] p-3.5">
              <dt className="font-bold text-ink">利用料金</dt>
              <dd className="mt-1 text-muted">現在はすべての機能を無料で使えます。</dd>
            </div>
            <div className="rounded-2xl border border-border bg-[#FAF7F2] p-3.5">
              <dt className="font-bold text-ink">保存件数・保存期間</dt>
              <dd className="mt-1 text-muted">現在、保存件数や保存期間の上限は設けていません。自分で消すまでアカウントに残ります。</dd>
            </div>
            <div className="rounded-2xl border border-border bg-[#FAF7F2] p-3.5">
              <dt className="font-bold text-ink">チェック頻度・ご注意</dt>
              <dd className="mt-1 text-muted">自動確認は毎朝1回です。元ページが削除済み・非公開の場合は取得できないことがあります。</dd>
            </div>
          </dl>
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
