import { currentUser, unauthorized } from "@/lib/current-user";
import { isListingId } from "@/lib/sources";
import { getRecord, getShareIdFor, publishShare, unpublishShare } from "@/lib/store";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!isListingId(id)) return Response.json({ message: "出品が見つかりません。" }, { status: 404 });
  const record = await getRecord(user.folder, id);
  if (!record) return Response.json({ message: "この出品はアカウントにありません。" }, { status: 404 });
  let cover = 0;
  try {
    const body = (await request.json()) as { coverIndex?: unknown };
    if (typeof body.coverIndex === "number" && Number.isInteger(body.coverIndex)) cover = body.coverIndex;
  } catch {
    cover = 0;
  }
  const share = await publishShare(user.folder, record, cover);
  return Response.json({ shareId: share.id, path: `/s/${share.id}` });
}

export async function GET(request: Request, context: Context) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const { id } = await context.params;
  const shareId = await getShareIdFor(user.folder, id);
  return Response.json({ shared: Boolean(shareId), path: shareId ? `/s/${shareId}` : null });
}

export async function DELETE(request: Request, context: Context) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const { id } = await context.params;
  await unpublishShare(user.folder, id);
  return Response.json({ ok: true });
}
