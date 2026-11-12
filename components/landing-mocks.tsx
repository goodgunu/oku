import Image from "next/image";
import { ArrowDown } from "lucide-react";

const YELLOW = "#ffdc00";
const YELLOW_ACCENT = "#D97706";

export const SAMPLE_ACTIVE = {
  site: "ヤフオク",
  category: "ホイール",
  title: "ENKEI RPF1RS 18x9.5j+12 114.3-5H シルバー 4本通し ＊1本裏リムにクラックあり　エンケイ　18インチ　5穴",
  titleShort: "ENKEI RPF1RS 18x9.5J+12",
  priceLabel: "現在価格",
  price: "81,000円",
  priceNumber: "81,000",
  previousPrice: "86,000円",
  dropLabel: "5,000円値下げ",
  buyNow: "115,000円",
  bids: "2件",
  condition: "やや傷や汚れあり",
  shipping: "落札者負担",
  prefecture: "茨城県",
  endTime: "11月14日 21:48",
  photoCount: 10,
  photo: "/samples/enkei-rpf1.jpg",
  memo: "1本裏リムにクラック。補修前提で相場比較用に残す",
};

export const SAMPLE_MERCARI = {
  site: "メルカリ",
  category: "スニーカー",
  title: "モラルコード【MORAL CODE】 レザースニーカー 27cm ベージュ",
  titleShort: "モラルコード レザースニーカー 27cm",
  priceLabel: "価格",
  price: "6,700円",
  priceNumber: "6,700",
  condition: "目立った傷や汚れなし",
  shipping: "送料込み",
  prefecture: "東京都",
  photoCount: 14,
  photo: "/samples/moral-code.jpg",
  url: "https://jp.mercari.com/item/m58867859200",
};

type Sample = {
  site: string;
  category: string;
  title: string;
  titleShort: string;
  priceLabel: string;
  price: string;
  priceNumber: string;
  photo: string;
  photoCount: number;
};

const PHOTO_BG = "#C5C3BE";

export function SamplePhoto({ src = SAMPLE_ACTIVE.photo, className = "" }: { src?: string; className?: string }) {
  return (
    <Image
      src={src}
      alt=""
      fill
      sizes="(max-width: 640px) 100vw, 420px"
      className={`object-contain ${className}`}
    />
  );
}

function Price({ sample, size = 20 }: { sample: Sample; size?: number }) {
  return (
    <p className="flex items-baseline gap-1 leading-none">
      <span className="text-[10px] font-bold" style={{ color: "#666666" }}>{sample.priceLabel}</span>
      <span className="font-extrabold tabular-nums text-ink" style={{ fontSize: size }}>{sample.priceNumber}</span>
      <span className="text-[11px] font-bold text-ink">円</span>
    </p>
  );
}

function Badge({ sample }: { sample: Sample }) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-[#E5C200] bg-[#FFF8D6] px-1.5 py-0.5 text-[9px] leading-none font-bold text-ink">
      {sample.site}
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

export function MiniCard({ ended, sample = SAMPLE_ACTIVE }: { ended: boolean; sample?: Sample }) {
  return (
    <div className="flex min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className={`relative w-[38%] shrink-0 self-stretch overflow-hidden ${ended ? "grayscale opacity-80" : ""}`} style={{ background: PHOTO_BG }}>
        <SamplePhoto src={sample.photo} />
      </div>
      <div className="min-w-0 flex-1 border-l-2 p-2.5" style={{ borderColor: YELLOW }}>
        <p className="text-[10px] font-medium" style={{ color: "#666666" }}>{sample.category}</p>
        <p className="line-clamp-2 break-words text-[13px] leading-snug font-bold text-ink">{sample.title}</p>
        <div className="mt-1"><Price sample={sample} size={19} /></div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-1 gap-y-1 text-[11px]">
          <Badge sample={sample} />
          <span className={ended ? "font-bold text-ended" : "font-bold text-live"}>{ended ? "終了" : "出品中"}</span>
          <span className="text-muted"> ・ 検討中</span>
        </p>
      </div>
    </div>
  );
}

// ヤフオクとメルカリの出品中を並べ、終わっても残ることも見せる
export function MockList() {
  return (
    <div role="img" aria-label="ヤフオクとメルカリの出品中の商品と、終了しても残る商品（サンプル）" className="mt-4 min-w-0 w-full">
      <div className="flex flex-col gap-2">
        <MiniCard ended={false} sample={SAMPLE_ACTIVE} />
        <MiniCard ended={false} sample={SAMPLE_MERCARI} />
      </div>
      <div className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-bold" style={{ color: "#78350F" }}>
        <ArrowDown className="size-3.5" aria-hidden />
        落札・掲載終了
      </div>
      <MiniCard ended sample={SAMPLE_ACTIVE} />
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
      <div className="relative aspect-[16/10] w-full overflow-hidden" style={{ background: PHOTO_BG }}>
        <SamplePhoto />
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

      <div className="relative aspect-[16/9] overflow-hidden" style={{ background: PHOTO_BG }}>
        <SamplePhoto />
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
            {SAMPLE_ACTIVE.dropLabel}
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
