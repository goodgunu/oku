// 公式LINE「おく」の友だち追加URL。
// basicId は公開情報。LINE_BASIC_ID（または Messaging API の bot/info）から取得し、
// 取れなければ NEXT_PUBLIC_LINE_ADD_URL を使う。
export async function getLineAddUrl(): Promise<string | null> {
  const fallback = process.env.NEXT_PUBLIC_LINE_ADD_URL || "https://line.me/R/ti/p/%40916kdopz";
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return fallback;
  try {
    const res = await fetch("https://api.line.me/v2/bot/info", {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { basicId?: string };
    if (!data.basicId) return fallback;
    return `https://line.me/R/ti/p/${encodeURIComponent(data.basicId)}`;
  } catch {
    return fallback;
  }
}
