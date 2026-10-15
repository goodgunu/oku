import { ArchiveForm } from "@/components/archive-form";
import { LibraryList } from "@/components/library-list";
import { listRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await listRecords();
  const lineReady = Boolean(
    process.env.LINE_CHANNEL_SECRET && process.env.LINE_CHANNEL_ACCESS_TOKEN,
  );

  return (
    <div className="space-y-8">
      <ArchiveForm />
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-violet-ink">ライブラリ</h2>
          <span className="text-xs text-muted">{listings.length}件</span>
        </div>
        <LibraryList listings={listings} />
      </section>
      <section className="rounded-2xl border border-border bg-card/80 p-4 text-sm text-muted">
        <p className="font-medium text-violet-ink">LINE連携</p>
        <p className="mt-1">
          {lineReady
            ? "LINE Webhook が設定済みです。出品URLを公式アカウントに送ると保存します。"
            : "LINE_CHANNEL_SECRET と LINE_CHANNEL_ACCESS_TOKEN を入れると、LINEからURL共有でおけます。"}
        </p>
      </section>
    </div>
  );
}
