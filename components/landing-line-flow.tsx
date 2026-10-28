export function LandingLineFlow() {
  return (
    <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StepCard step={1} title="出品ページで「共有」を押す" caption="ヤフオク・PayPayフリマ・ジモティー・メルカリの共有ボタンを押します。">
        <ListingScreen />
      </StepCard>

      <StepCard step={2} title="共有先から「LINE」を選ぶ" caption="出てきた共有メニューで、LINEのアイコンをタップします。">
        <ShareSheetScreen />
      </StepCard>

      <StepCard step={3} title="「おく」を選んで送信" caption="送信先に公式LINE「おく」を選んで、そのまま送ります。">
        <LinePickerScreen />
      </StepCard>

      <StepCard step={4} title="数秒でカードが届いて保存完了" caption="タイトル・価格・写真が自動で保存され、いつでも見返せます。">
        <LineChatScreen />
      </StepCard>
    </ol>
  );
}

function StepCard({
  step,
  title,
  caption,
  children,
}: {
  step: number;
  title: string;
  caption: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-border bg-card p-3.5">
      <div className="flex items-center gap-2">
        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-[#ffdc00] text-xs font-extrabold text-black">
          {step}
        </span>
        <p className="text-sm font-bold leading-snug text-ink">{title}</p>
      </div>
      <div className="my-3 flex flex-1 items-center justify-center">{children}</div>
      <p className="text-xs leading-5 text-muted">{caption}</p>
    </li>
  );
}

function PhoneFrame({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="w-full max-w-[210px] overflow-hidden rounded-2xl border-2 bg-white shadow-xs"
      style={{ borderColor: "#E5E0DA" }}
      aria-hidden="true"
    >
      <div className="border-b px-2.5 py-1.5 text-[10px] font-bold" style={{ borderColor: "#EFEAE3", background: "#FAF7F2" }}>
        {header}
      </div>
      <div className="p-2.5 text-[11px]">{children}</div>
    </div>
  );
}

function ListingScreen() {
  return (
    <PhoneFrame
      header={
        <div className="flex items-center justify-between text-muted">
          <span className="truncate">auctions.yahoo.co.jp</span>
        </div>
      }
    >
      <div className="rounded-lg bg-[#fff8d6] p-2">
        <div className="h-9 rounded bg-white/80" />
        <p className="mt-1.5 truncate text-[10px] font-bold text-ink">SONY α7 IV ボディ 美品</p>
        <p className="text-[11px] font-extrabold text-ink">現在 248,000円</p>
      </div>
      <div className="mt-2 flex items-center justify-between rounded-lg border-2 border-[#ffdc00] bg-[#fff8d6] px-2.5 py-1.5">
        <span className="text-[10px] font-bold text-ink">この出品を共有</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-[#ffdc00] px-2 py-0.5 text-[10px] font-bold text-black">
          共有
        </span>
      </div>
    </PhoneFrame>
  );
}

function ShareSheetScreen() {
  return (
    <PhoneFrame header={<span className="text-muted">共有メニュー</span>}>
      <div className="space-y-2">
        <p className=" truncate rounded bg-background px-2 py-1 text-[9px] text-muted">
          SONY α7 IV ボディ https://auctions.yahoo...
        </p>
        <div className="grid grid-cols-4 gap-1.5 pt-1 text-center text-[9px]">
          <div className="flex flex-col items-center rounded-lg p-1 ring-2 ring-[#06C755]" style={{ background: "#EAFBF0" }}>
            <span className="flex size-7 items-center justify-center rounded-xl text-[9px] font-extrabold text-white" style={{ background: "#06C755" }}>
              LINE
            </span>
            <span className="mt-0.5 font-bold" style={{ color: "#057A35" }}>LINE</span>
          </div>
          <AppIcon label="コピー" bg="#E4E4E7" />
          <AppIcon label="メール" bg="#DBEAFE" />
          <AppIcon label="その他" bg="#F4F4F5" />
        </div>
      </div>
    </PhoneFrame>
  );
}

function AppIcon({ label, bg }: { label: string; bg: string }) {
  return (
    <div className="flex flex-col items-center p-1 text-muted">
      <span className="size-7 rounded-xl" style={{ background: bg }} />
      <span className="mt-0.5">{label}</span>
    </div>
  );
}

function LinePickerScreen() {
  return (
    <PhoneFrame
      header={
        <div className="flex items-center justify-between">
          <span style={{ color: "#06C755" }}>LINE · 送信先を選択</span>
          <span className="rounded px-1.5 py-0.5 text-[9px] font-bold text-white" style={{ background: "#06C755" }}>
            転送
          </span>
        </div>
      }
    >
      <div className="space-y-1.5">
        <div className="flex items-center justify-between rounded-lg border-2 p-1.5" style={{ borderColor: "#06C755", background: "#EAFBF0" }}>
          <div className="flex items-center gap-1.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-[#ffdc00] text-[10px] font-extrabold text-black">
              おく
            </span>
            <div>
              <p className="text-[10px] font-bold leading-tight text-ink">おく</p>
              <p className="text-[8px] text-muted">公式アカウント</p>
            </div>
          </div>
          <span className="flex size-4 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ background: "#06C755" }}>
            ✓
          </span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg px-1.5 py-1 opacity-50">
          <span className="size-6 rounded-full bg-zinc-200" />
          <span className="text-[10px] text-muted">友だち A</span>
        </div>
      </div>
    </PhoneFrame>
  );
}

function LineChatScreen() {
  return (
    <PhoneFrame header={<span style={{ color: "#06C755" }}>LINE · おく</span>}>
      <div className="space-y-1.5 rounded-lg p-2" style={{ background: "#8CABD9" }}>
        <div className="ml-auto max-w-[85%] rounded-xl px-2 py-1 text-[9px] font-medium" style={{ background: "#8DE055", color: "#1B1917" }}>
          https://auctions.yahoo.co.jp/...
        </div>
        <div className="max-w-[92%] rounded-xl bg-white p-1.5 shadow-2xs">
          <p className="text-[9px] font-bold text-muted">おくったよ</p>
          <p className="truncate text-[10px] font-bold text-ink">SONY α7 IV ボディ</p>
          <p className="text-[9px] text-muted">現在価格: 248,000円</p>
          <p className="mt-1 rounded bg-[#ffdc00] py-0.5 text-center text-[9px] font-bold text-black">
            おくで見る
          </p>
        </div>
      </div>
    </PhoneFrame>
  );
}
