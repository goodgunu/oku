import { isFolder, verifyPhoto } from "@/lib/account";
import { currentUser } from "@/lib/current-user";
import { getRecord } from "@/lib/store";
import { getR2Object, isR2Enabled } from "@/lib/r2";
import { isYahooListingId } from "@/lib/yahoo-url";

type Ctx = { params: Promise<{ id: string; index: string }> };

/**
 * 写真。ログイン中は自分の写真だけ。LINE のカード用に、署名つき URL（?u=&t=）でもひらける。
 */
export async function GET(request: Request, context: Ctx) {
  const { id, index } = await context.params;
  const i = Number(index);
  if (!isR2Enabled() || !isYahooListingId(id) || !Number.isInteger(i) || i < 0) {
    return new Response("not found", { status: 404 });
  }
  const url = new URL(request.url);
  const u = url.searchParams.get("u") || "";
  const t = url.searchParams.get("t") || "";
  let folder = "";
  if (u && isFolder(u) && verifyPhoto(u, id, i, t)) {
    folder = u;
  } else {
    const user = await currentUser();
    if (!user) return Response.json({ message: "Googleでログインしてください。" }, { status: 401 });
    folder = user.folder;
  }
  const record = await getRecord(folder, id);
  const key = record?.photos[i]?.key;
  if (!key) return new Response("not found", { status: 404 });
  const obj = await getR2Object(key);
  if (!obj) return new Response("not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": obj.contentType || "image/jpeg",
    "Cache-Control": "private, max-age=31536000, immutable",
  };
  if (obj.length) headers["Content-Length"] = String(obj.length);
  return new Response(obj.body, { headers });
}
