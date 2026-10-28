const SAMPLE_ACTIVE = {
  site: "ヤフオク",
  title: "美品 SONY α7 IV ILCE-7M4 ボディ 元箱・付属品完備 シャッター数少",
  priceLabel: "現在価格",
  price: "248,000円",
  buyNow: "268,000円",
  bids: "14件",
  condition: "目立った傷や汚れなし",
  shipping: "送料無料",
  prefecture: "東京都",
  endTime: "10月30日 22:15",
  photoCount: 10,
};

const SAMPLE_ENDED = {
  site: "メルカリ",
  title: "Apple MacBook Air M3 13インチ 16GB / 512GB ミッドナイト",
  priceLabel: "価格",
  price: "162,000円",
  condition: "未使用に近い",
  shipping: "送料込み",
  prefecture: "神奈川県",
  photoCount: 8,
  memo: "バッテリー最大容量100%・充放電12回。相場比較用に残す",
};

export function MockHeroCard() {
  return (
    <div
      className="mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl border border-border bg-card shadow-lg sm:max-w-[380px]"
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

export function MockList() {
  return (
    <div className="space-y-2.5" aria-label="保存した一覧の見本">
      <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-xs">
        <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-[#fff8d6]">
          <CameraIllustration className="h-10 w-16 text-ink/80" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded bg-[#008a00] px-1.5 py-0.5 text-[10px] font-bold text-white">出品中</span>
            <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-ink/80">
              {SAMPLE_ACTIVE.site}
            </span>
            <span className="rounded-full bg-[#fff8d6] px-2 py-0.5 text-[10px] font-bold text-ink">検討中</span>
          </div>
          <p className="mt-1 truncate text-sm font-bold text-ink">{SAMPLE_ACTIVE.title}</p>
          <p className="mt-0.5 text-xs text-muted">
            <span className="font-bold text-ink">{SAMPLE_ACTIVE.price}</span> · 入札 {SAMPLE_ACTIVE.bids} · {SAMPLE_ACTIVE.shipping}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 py-0.5 text-xs font-bold text-ink">
        <span className="h-px w-8 bg-black/30" />
        <span>↓ 落札・掲載終了</span>
        <span className="h-px w-8 bg-black/30" />
      </div>

      <div className="rounded-2xl border-2 border-[#ffdc00] bg-card p-3 shadow-xs">
        <div className="flex gap-3">
          <div className="flex h-16 w-20 shrink-0 items-center justify-center rounded-lg bg-[#fff8d6]">
            <CameraIllustration className="h-10 w-16 text-ink/70" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[#c62828] px-1.5 py-0.5 text-[10px] font-bold text-white">終了</span>
              <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-ink/80">
                {SAMPLE_ENDED.site}
              </span>
              <span className="text-[11px] font-bold text-ink">→ おくならそのまま残る</span>
            </div>
            <p className="mt-1 truncate text-sm font-bold text-ink">{SAMPLE_ENDED.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              <span className="font-bold text-ink">{SAMPLE_ENDED.price}</span> · {SAMPLE_ENDED.condition} · 写真{SAMPLE_ENDED.photoCount}枚保存済み
            </p>
          </div>
        </div>
        <div className="mt-2.5 rounded-xl bg-[#fff8d6] px-3 py-2 text-xs leading-5">
          <p className="font-bold text-ink">写真もメモも残ります</p>
          <p className="mt-0.5 text-ink/80">メモ：{SAMPLE_ENDED.memo}</p>
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background px-2 py-1">
      <dt className="text-[10px] text-muted">{label}</dt>
      <dd className="truncate font-semibold text-ink">{value}</dd>
    </div>
  );
}

function CameraIllustration({ className }: { className?: string }) {
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
