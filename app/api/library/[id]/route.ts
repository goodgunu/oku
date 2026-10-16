import { currentUser, unauthorized } from "@/lib/current-user";
import { deleteRecord, getRecord } from "@/lib/store";
import { isListingId } from "@/lib/sources";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!isListingId(id)) {
    return Response.json({ message: "出品IDが不正です。" }, { status: 400 });
  }
  const listing = await getRecord(user.folder, id);
  if (!listing) {
    return Response.json({ message: "見つかりませんでした。" }, { status: 404 });
  }
  return Response.json({ listing });
}

export async function DELETE(_request: Request, context: Ctx) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!isListingId(id)) {
    return Response.json({ message: "出品IDが不正です。" }, { status: 400 });
  }
  const existing = await getRecord(user.folder, id);
  if (!existing) {
    return Response.json({ message: "見つかりませんでした。" }, { status: 404 });
  }
  await deleteRecord(user.folder, id);
  return Response.json({ ok: true });
}
