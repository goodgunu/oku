import { deleteRecord, getRecord } from "@/lib/store";
import { isYahooListingId } from "@/lib/yahoo-url";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { id } = await context.params;
  if (!isYahooListingId(id)) {
    return Response.json({ message: "出品IDが不正です。" }, { status: 400 });
  }
  const listing = await getRecord(id);
  if (!listing) {
    return Response.json({ message: "見つかりませんでした。" }, { status: 404 });
  }
  return Response.json({ listing });
}

export async function DELETE(_request: Request, context: Ctx) {
  const { id } = await context.params;
  if (!isYahooListingId(id)) {
    return Response.json({ message: "出品IDが不正です。" }, { status: 400 });
  }
  const existing = await getRecord(id);
  if (!existing) {
    return Response.json({ message: "見つかりませんでした。" }, { status: 404 });
  }
  await deleteRecord(id);
  return Response.json({ ok: true });
}
