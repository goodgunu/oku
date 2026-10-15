import { getLineAddUrl } from "@/lib/line-add";

export async function LineAddCard() {
  const url = await getLineAddUrl();
  if (!url) return null;
  const id = decodeURIComponent(url.split("/ti/p/")[1] ?? "");
  return (
    <section className="rounded-2xl border border-[#ffdc00] bg-[#fff8d6] p-3">
      <div className="space-y-3 rounded-xl bg-white p-4">
        <p className="text-sm leading-relaxed text-ink">
          公式LINE「おく」{id ? `（${id}）` : ""}を友だち追加すると、ヤフオクの共有から出品を送れます。
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full rounded-full bg-[#06C755] px-4 py-3 text-center text-sm font-bold text-white"
        >
          公式LINEを友だち追加
        </a>
      </div>
    </section>
  );
}
