import { getLineAddUrl } from "@/lib/line-add";

export async function LineAddCard() {
  const url = (await getLineAddUrl()) || "https://line.me/R/ti/p/%40916kdopz";
  const id = decodeURIComponent(url.split("/ti/p/")[1] ?? "@916kdopz");
  return (
    <section className="rounded-2xl border border-[#ffdc00] bg-[#fff8d6] p-3">
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-bold text-ink">
            公式LINE「おく」{id ? `（${id}）` : ""}
          </p>
          <p className="text-xs leading-relaxed text-muted">
            友だち追加して連携すると、出品ページのURLをトークで送るだけで保存でき、値下げや終了のお知らせも受け取れます。
          </p>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#06C755] px-5 py-2.5 text-center text-sm font-bold text-white shadow-xs hover:opacity-95"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-line.png" alt="" width={20} height={20} className="size-5 rounded-sm" />
          LINEで友だち追加
        </a>
      </div>
    </section>
  );
}
