import { getSharePhoto } from "@/lib/store";

type Context = { params: Promise<{ sid: string; index: string }> };

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export async function GET(_request: Request, context: Context) {
  const { sid, index } = await context.params;
  const photo = await getSharePhoto(sid, Number(index));
  if (!photo) return new Response("写真がありません。", { status: 404 });
  const type = photo.contentType && IMAGE_TYPES.has(photo.contentType) ? photo.contentType : "image/jpeg";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
  };
  if (photo.length) headers["Content-Length"] = String(photo.length);
  return new Response(photo.body, { headers });
}
