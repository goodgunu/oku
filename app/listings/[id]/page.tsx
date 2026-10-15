import Link from "next/link";
import { notFound } from "next/navigation";
import { formatYen } from "@/lib/format";
import { getRecord } from "@/lib/store";
import { isYahooListingId } from "@/lib/yahoo-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  if (!isYahooListingId(id)) notFound();
  const listing = await getRecord(id);
  if (!listing) notFound();

  return (
    <article className="space-y-6">
      <Link href="/" className="text-sm text-muted hover:text-violet-ink">
        ← ライブラリ
      </Link>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={
              listing.availability === "live"
                ? "rounded-full bg-live/10 px-2 py-0.5 font-medium text-live"
                : listing.availability === "ended"
                  ? "rounded-full bg-ended/10 px-2 py-0.5 font-medium text-ended"
                  : "rounded-full bg-border px-2 py-0.5 font-medium text-muted"
            }
          >
            {listing.availability === "live"
              ? "出品中"
              : listing.availability === "ended"
                ? "終了"
                : "不明"}
          </span>
          <span className="text-muted">{listing.id}</span>
        </div>
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold leading-snug text-violet-ink">
          {listing.title}
        </h2>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-3">
        <Fact label="現在価格" value={listing.priceLabel} />
        <Fact label="入札" value={listing.bidCount != null ? `${listing.bidCount}件` : "—"} />
        <Fact label="即決" value={listing.buyNowYen != null ? formatYen(listing.buyNowYen) : "—"} />
        <Fact label="出品者" value={listing.seller || "—"} />
        <Fact label="状態" value={listing.condition || "—"} />
        <Fact label="終了" value={listing.endTimeLabel || "—"} />
      </dl>

      <p className="text-sm">
        <a
          href={listing.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-violet underline-offset-2 hover:underline"
        >
          元の出品ページを開く
        </a>
      </p>

      {listing.photos.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-violet-ink">写真（{listing.photos.length}）</h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {listing.photos.map((photo, index) => (
              <a
                key={`${photo.url}-${index}`}
                href={photo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="overflow-hidden rounded-xl border border-border bg-card"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.caption || ""} className="aspect-square w-full object-cover" />
              </a>
            ))}
          </div>
        </section>
      )}

      {listing.description && (
        <section className="space-y-2">
          <h3 className="text-sm font-medium text-violet-ink">説明</h3>
          <pre className="whitespace-pre-wrap rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed text-foreground/90">
            {listing.description}
          </pre>
        </section>
      )}

      <p className="text-xs text-muted">
        保存: {new Date(listing.savedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })} · 更新:{" "}
        {new Date(listing.updatedAt).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}
      </p>
    </article>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
