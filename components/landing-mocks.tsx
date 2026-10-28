import { ArrowDown } from "lucide-react";

const YELLOW = "#ffdc00";
const YELLOW_ACCENT = "#D97706";

export const SAMPLE_ACTIVE = {
  site: "ヤフオク",
  category: "ミラーレス一眼",
  title: "美品 SONY α7 IV ILCE-7M4 ボディ 元箱・付属品完備",
  priceLabel: "現在価格",
  price: "248,000円",
  priceNumber: "248,000",
  buyNow: "268,000円",
  bids: "14件",
  condition: "目立った傷や汚れなし",
  shipping: "送料無料",
  prefecture: "東京都",
  endTime: "10月30日 22:15",
  photoCount: 10,
  memo: "シャッター回数3,200回・元箱あり。相場比較用に残す",
};

function Price({ size = 20 }: { size?: number }) {
  return (
    <p className="flex items-baseline gap-1 leading-none">
      <span className="text-[10px] font-bold" style={{ color: "#666666" }}>{SAMPLE_ACTIVE.priceLabel}</span>
      <span className="font-extrabold tabular-nums text-ink" style={{ fontSize: size }}>{SAMPLE_ACTIVE.priceNumber}</span>
      <span className="text-[11px] font-bold text-ink">円</span>
    </p>
  );
}

function Badge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#E5C200] bg-[#FFF8D6] px-1.5 py-0.5 text-[9px] leading-none font-bold text-ink">
      {SAMPLE_ACTIVE.site}
    </span>
  );
}

function SpecChip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-[#FAF7F2] px-2 py-0.5 text-[11px] leading-4">
      <span className="shrink-0 font-medium text-muted">{label}</span>
      <span className="truncate font-bold text-ink">{value}</span>
    </span>
  );
}

export function MiniCard({ ended }: { ended: boolean }) {
  return (
    <div className="flex min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className={`relative flex w-[38%] shrink-0 items-center justify-center self-stretch bg-gradient-to-br from-[#fff8d6] via-[#ffef99] to-[#ffdc00]/60 p-2 ${ended ? "grayscale opacity-80" : ""}`}>
        <CameraIllustration className="h-14 w-24 text-ink/85" />
      </div>
      <div className="min-w-0 flex-1 border-l-2 p-2.5" style={{ borderColor: YELLOW }}>
        <p className="text-[10px] font-medium" style={{ color: "#666666" }}>{SAMPLE_ACTIVE.category}</p>
        <p className="line-clamp-2 break-words text-[13px] leading-snug font-bold text-ink">{SAMPLE_ACTIVE.title}</p>
        <div className="mt-1"><Price size={19} /></div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px]">
          <Badge />
          <span className={ended ? "font-bold text-ended" : "font-bold text-live"}>{ended ? "終了" : "出品中"}</span>
          <span className="text-muted"> ・ 検討中</span>
        </p>
      </div>
    </div>
  );
}

// 出品中と終了を並べて、終わっても残ることを見せる
export function MockList() {
  return (
    <div role="img" aria-label="出品中の商品と、終了しても残る商品（サンプル）" className="mt-4 min-w-0 w-full">
      <MiniCard ended={false} />
      <div className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold" style={{ color: "#78350F" }}>
        <ArrowDown className="size-3.5" aria-hidden />
        落札・掲載終了
      </div>
      <MiniCard ended />
      <p
        className="mt-2 rounded-xl px-3 py-2 text-center text-[12px] leading-5 font-bold"
        style={{ background: "#FFFFFF", color: "#1C1917", border: "1px solid #E5C200" }}
      >
        <span style={{ color: YELLOW_ACCENT }}>写真もメモも残ります</span>
        <span className="block text-[10px] font-normal" style={{ color: "#6B6560" }}>
          メモ「{SAMPLE_ACTIVE.memo}」もそのまま
        </span>
      </p>
    </div>
  );
}

// アプリの一覧の実カードと同じ構成のサンプル（LandingLineFlow のステップ4などで使用）
export function AppCard() {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="relative flex aspect-[16/10] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-[#fff8d6] via-[#ffef99] to-[#ffdc00]/60">
        <CameraIllustration className="h-20 w-32 text-ink/85" />
        <span className="absolute right-2.5 bottom-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
          写真{SAMPLE_ACTIVE.photoCount}枚
        </span>
      </div>
      <div className="min-w-0 border-t-2 p-3 pb-3.5" style={{ borderColor: YELLOW }}>
        <p className="text-xs font-medium tracking-wide text-muted">{SAMPLE_ACTIVE.category}</p>
        <h3 className="line-clamp-2 break-words text-[15px] leading-snug font-bold text-ink">{SAMPLE_ACTIVE.title}</h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
          <p className="flex items-baseline gap-1 leading-none whitespace-nowrap">
            <span className="text-[11px] font-bold text-muted">{SAMPLE_ACTIVE.priceLabel}</span>
            <span className="text-[22px] font-extrabold tabular-nums text-ink">{SAMPLE_ACTIVE.priceNumber}</span>
            <span className="text-xs font-bold text-ink">円</span>
          </p>
          <p className="text-xs whitespace-nowrap text-muted">
            即決 <span className="font-medium tabular-nums text-ink">{SAMPLE_ACTIVE.buyNow}</span>
          </p>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <SpecChip label="入札" value={SAMPLE_ACTIVE.bids} />
          <SpecChip label="送料" value={SAMPLE_ACTIVE.shipping} />
          <SpecChip label="状態" value={SAMPLE_ACTIVE.condition} />
        </div>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-xs">
          <span className="mr-1 inline-flex shrink-0 items-center rounded-full border border-[#E5C200] bg-[#FFF8D6] px-2 py-0.5 text-[10px] leading-none font-bold text-ink">
            {SAMPLE_ACTIVE.site}
          </span>
          <span className="font-bold text-live">出品中</span>
          <span className="text-muted"> ・ 検討中 ・ {SAMPLE_ACTIVE.prefecture}</span>
        </p>
      </div>
    </div>
  );
}

export function MockHeroCard() {
  return (
    <div
      className="mx-auto w-full max-w-[360px] min-w-0 overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:max-w-[380px]"
      aria-label="保存した出品の表示見本"
    >
      <div className="flex items-center justify-between border-b border-black/10 bg-[#ffdc00] px-3.5 py-2 text-[11px] font-bold text-black">
        <span>保存済み · いつでも見返せます</span>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px]">写真{SAMPLE_ACTIVE.photoCount}枚</span>
      </div>

      <div className="relative flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#fff8d6] via-[#ffef99] to-[#ffdc00]/60">
        <CameraIllustration className="h-24 w-36 text-ink/80" />
        <span className="absolute top-2.5 left-2.5 rounded-full bg-[#008a00] px-2.5 py-0.5 text-[10px] font-bold text-white">
          出品中
        </span>
        <span className="absolute top-2.5 right-2.5 rounded border border-black/15 bg-white/95 px-2 py-0.5 text-[10px] font-bold text-ink">
          {SAMPLE_ACTIVE.site}
        </span>
        <span className="absolute right-2.5 bottom-2 rounded-full bg-black/75 px-2 py-0.5 text-[10px] font-bold text-white">
          1 / {SAMPLE_ACTIVE.photoCount}
        </span>
      </div>

      <div className="p-3.5 sm:p-4">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-ink">{SAMPLE_ACTIVE.title}</p>

        <div className="mt-2.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-y border-border py-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[10px] font-bold text-muted">{SAMPLE_ACTIVE.priceLabel}</span>
            <span className="text-xl font-extrabold tabular-nums text-ink">{SAMPLE_ACTIVE.price}</span>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
            5,000円値下げ
          </span>
        </div>

        <dl className="mt-2.5 grid grid-cols-2 gap-1.5 text-xs">
          <Spec label="入札" value={SAMPLE_ACTIVE.bids} />
          <Spec label="即決" value={SAMPLE_ACTIVE.buyNow} />
          <Spec label="状態" value={SAMPLE_ACTIVE.condition} />
          <Spec label="送料" value={SAMPLE_ACTIVE.shipping} />
        </dl>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-md bg-background px-2 py-1">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="truncate font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function CameraIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" fill="none" className={className} aria-hidden="true">
      <rect x="18" y="22" width="84" height="46" rx="8" fill="#222" />
      <path d="M42 22l6-9h24l6 9H42z" fill="#333" />
      <circle cx="60" cy="45" r="16" fill="#ffdc00" />
      <circle cx="60" cy="45" r="11" fill="#111" />
      <circle cx="64" cy="41" r="3" fill="#fff" />
      <rect x="26" y="28" width="10" height="5" rx="2" fill="#ffdc00" />
    </svg>
  );
}
