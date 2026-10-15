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

  const badge =
    listing.availability === "live"
      ? { label: "出品中", className: "bg-live text-white" }
      : listing.availability === "ended"
        ? { label: "終了", className: "bg-ended text-white" }
        : { label: "不明", className: "bg-border text-muted" };

  return (
    <article className="space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink"
      >
        ← ライブラリ
      </Link>

      <div className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${badge.className}`}>
            {badge.label}
          </span>
          <span className="text-muted">{listing.id}</span>
        </div>
        <h1 className="text-xl font-bold leading-snug text-ink sm:text-2xl">{listing.title}</h1>
        <p className="text-2xl font-bold text-ink sm:text-3xl">{listing.priceLabel}</p>
      </div>

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm shadow-sm sm:grid-cols-3">
        <Fact label="入札" value={listing.bidCount != null ? `${listing.bidCount}件` : "—"} />
        <Fact label="即決" value={listing.buyNowYen != null ? formatYen(listing.buyNowYen) : "—"} />
        <Fact label="出品者" value={listing.seller || "—"} />
        <Fact label="状態" value={listing.condition || "—"} />
        <Fact label="終了" value={listing.endTimeLabel || "—"} />
        <Fact
          label="元ページ"
          value={
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-ink underline decoration-yahoo decoration-2 underline-offset-2 hover:text-black"
            >
              ヤフオクで開く
            </a>
          }
        />
      </dl>

      {listing.photos.length > 0 && (
        <section className="space-y-3">
          <h2 className="border-b-2 border-yahoo pb-1 text-sm font-bold text-ink">
            写真（{listing.photos.length}）
          </h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {listing.photos.map((photo, index) => {
              const src = photo.key ? `/api/photo/${listing.id}/${index}` : photo.url;
              return (
                <a
                  key={`${photo.url}-${index}`}
                  href={src}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={photo.caption || ""}
                    className="aspect-square w-full object-cover"
                  />
                </a>
              );
            })}
          </div>
        </section>
      )}

      {listing.description && (
        <section className="space-y-2">
          <h2 className="border-b-2 border-yahoo pb-1 text-sm font-bold text-ink">説明</h2>
          <pre className="whitespace-pre-wrap rounded-xl border border-border bg-card p-4 text-sm leading-relaxed text-ink shadow-sm">
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

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 font-bold text-ink">{value}</dd>
    </div>
  );
}
