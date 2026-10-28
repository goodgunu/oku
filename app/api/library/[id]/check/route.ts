import { currentUser, unauthorized } from "@/lib/current-user";
import { refreshStoredListing } from "@/lib/daily-check";
import { priceChange } from "@/lib/price-history";
import { isListingId } from "@/lib/sources";
import { getRecord, putRecord } from "@/lib/store";

export const maxDuration = 60;

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!isListingId(id)) return Response.json({ message: "出品が見つかりません。" }, { status: 404 });
  const record = await getRecord(user.folder, id);
  if (!record) return Response.json({ message: "この出品はアカウントにありません。" }, { status: 404 });
  const next = await refreshStoredListing(record);
  await putRecord(user.folder, next);
  const failed = Boolean(next.checkAttemptAt) && next.lastCheckedAt === record.lastCheckedAt;
  return Response.json({
    record: next,
    listing: next,
    failed,
    price: priceChange(next),
  });
}
