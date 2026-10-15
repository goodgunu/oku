import { getRecord } from "@/lib/store";
import { getR2Object, isR2Enabled } from "@/lib/r2";
import { isYahooListingId } from "@/lib/yahoo-url";

type Ctx = { params: Promise<{ id: string; index: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id, index } = await context.params;
  const i = Number(index);
  if (!isR2Enabled() || !isYahooListingId(id) || !Number.isInteger(i) || i < 0) {
    return new Response("not found", { status: 404 });
  }
  const record = await getRecord(id);
  const key = record?.photos[i]?.key;
  if (!key) return new Response("not found", { status: 404 });
  const obj = await getR2Object(key);
  if (!obj) return new Response("not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType || "image/jpeg",
    "Cache-Control": "public, max-age=31536000, immutable",
  };
  if (obj.length) headers["Content-Length"] = String(obj.length);
  return new Response(obj.body, { headers });
}
