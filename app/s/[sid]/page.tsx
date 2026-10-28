import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { DescriptionSection, EquipmentTags } from "@/components/detail-blocks";
import { SpecChip } from "@/components/spec-chip";
import { getShare } from "@/lib/store";

type Props = { params: Promise<{ sid: string }> };

async function origin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function statusText(availability: string): string {
  return availability === "ended" ? "掲載終了" : availability === "live" ? "出品中" : "";
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sid } = await params;
  const share = await getShare(sid);
  if (!share) return { title: "共有ページが見つかりません", robots: { index: false, follow: false } };
  const { listing } = share;
  const base = await origin();
  const title = listing.name;
  const price = listing.price ? `${listing.priceLabel} ${listing.price}` : "";
  const description = [price, `おくで保存した出品（${listing.sourceLabel}）です。写真つきで見られます。`]
    .filter(Boolean)
    .join("。");
  const image = listing.photoCount > 0 ? `${base}/api/share/${share.id}/photos/${listing.coverIndex}` : undefined;
  return {
    metadataBase: new URL(base),
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: price ? `${title} ${price}` : title,
      description,
      url: `${base}/s/${share.id}`,
      siteName: "おく",
      type: "article",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: price ? `${title} ${price}` : title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { sid } = await params;
  const share = await getShare(sid);
  if (!share) notFound();
  const { listing } = share;
  const indexes = Array.from({ length: listing.photoCount }, (_, i) => i);
  const status = statusText(listing.availability);
  const chips = [
    { label: "サイト", value: listing.sourceLabel },
    { label: "状態", value: listing.condition || "" },
    { label: "送料", value: listing.shipping || "" },
    { label: "地域", value: listing.prefecture || "" },
    { label: "即決", value: listing.buyNow || "" },
    { label: "入札", value: listing.bidCount != null ? `${listing.bidCount}件` : "" },
  ].filter((c) => c.value);

  const tags = [
    ...(listing.category
      ? listing.category
          .split(/[>＞/・,、]+/)
          .map((s) => s.trim())
          .filter(Boolean)
      : []),
    ...(listing.condition ? [listing.condition] : []),
    ...(listing.shipping ? [listing.shipping] : []),
    ...(listing.prefecture ? [listing.prefecture] : []),
  ];

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-8">
      {indexes.length > 0 && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/share/${share.id}/photos/${indexes[0]}`}
            alt={listing.name}
            className="aspect-[16/10] w-full rounded-2xl border border-border bg-background object-cover"
          />
          {indexes.length > 1 && (
            <div className="grid grid-cols-2 gap-2">
              {indexes.slice(1).map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`/api/share/${share.id}/photos/${i}`}
                  alt=""
                  loading="lazy"
                  className="aspect-[16/10] w-full rounded-xl border border-border bg-background object-cover"
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {status && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-bold text-white ${
                listing.availability === "ended" ? "bg-ended" : "bg-live"
              }`}
            >
              {status}
            </span>
          )}
          <span className="rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-bold text-ink/70">
            {listing.sourceLabel}
          </span>
        </div>
        <h1 className="mt-1.5 text-[19px] font-bold leading-snug break-words text-ink">{listing.name}</h1>
        {listing.price && (
          <p className="mt-2 flex items-baseline gap-1.5 leading-none">
            <span className="text-[11px] font-bold text-muted">{listing.priceLabel}</span>
            <span className="text-[26px] font-extrabold tabular-nums text-ink">{listing.price}</span>
          </p>
        )}
        {chips.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5" data-share="chips">
            {chips.map((chip) => (
              <SpecChip key={chip.label} label={chip.label} value={chip.value} />
            ))}
          </div>
        )}
      </div>

      <EquipmentTags items={tags} />

      <DescriptionSection text={listing.description} />

      <section className="mt-6 rounded-2xl border border-[#ffdc00] bg-[#fff8d6] p-5 text-center">
        <p className="text-sm font-bold text-ink">気になる出品を、消える前に残す</p>
        <p className="mt-1 text-xs leading-6 text-ink/80">
          ヤフオク・PayPayフリマ・ジモティー・メルカリの出品は、落札や掲載終了で見られなくなります。おくなら、写真も価格も自分のアカウントに残せます。
        </p>
        <Link
          href="/"
          className="mt-3 inline-block rounded-full bg-[#ffdc00] px-6 py-3 text-sm font-bold text-black shadow-xs hover:bg-[#f5c400]"
        >
          おくで保存する
        </Link>
      </section>

      <p className="mt-6 text-center text-[11px] leading-5 text-muted">
        {/^https?:\/\//.test(listing.sourceUrl) && (
          <>
            元の出品ページ:{" "}
            <a
              href={listing.sourceUrl}
              target="_blank"
              rel="noreferrer nofollow"
              className="inline-flex items-center gap-0.5 underline underline-offset-2"
            >
              開く
              <ExternalLink className="size-3" />
            </a>
            <br />
          </>
        )}
        出品の文章と写真の権利は、出品者と各サイトにあります。
        <br />
        <Link href="/privacy" className="underline underline-offset-2">
          プライバシーポリシー
        </Link>
      </p>
    </div>
  );
}
