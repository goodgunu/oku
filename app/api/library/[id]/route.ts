import { currentUser, unauthorized } from "@/lib/current-user";
import { deleteRecord, getRecord, putRecord } from "@/lib/store";
import { isListingId } from "@/lib/sources";
import type { ArchiveRecord, MemoEntry, ParsedPhoto, WatchStatus } from "@/lib/types";

type Ctx = { params: Promise<{ id: string }> };

function isWatchStatus(value: unknown): value is WatchStatus {
  return value === "watching" || value === "contacted" || value === "passed" || value === "bought";
}

export async function GET(request: Request, context: Ctx) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!isListingId(id)) {
    return Response.json({ message: "出品IDが不正です。" }, { status: 400 });
  }
  const listing = await getRecord(user.folder, id);
  if (!listing) {
    return Response.json({ message: "見つかりませんでした。" }, { status: 404 });
  }
  return Response.json({ listing, record: listing });
}

export async function PATCH(request: Request, context: Ctx) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const { id } = await context.params;
  if (!isListingId(id)) {
    return Response.json({ message: "出品IDが不正です。" }, { status: 400 });
  }
  const existing = await getRecord(user.folder, id);
  if (!existing) {
    return Response.json({ message: "見つかりませんでした。" }, { status: 404 });
  }
  let body: Partial<ArchiveRecord>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "更新を読み取れませんでした。" }, { status: 400 });
  }
  const next: ArchiveRecord = {
    ...existing,
    updatedAt: new Date().toISOString(),
  };
  if (typeof body.memo === "string") next.memo = body.memo.slice(0, 4000);
  if (Array.isArray(body.memoEntries)) {
    next.memoEntries = body.memoEntries.slice(0, 40).flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const item = entry as Partial<MemoEntry>;
      if (typeof item.text !== "string" || !item.text.trim()) return [];
      const at = typeof item.at === "string" && !Number.isNaN(Date.parse(item.at)) ? item.at : new Date().toISOString();
      return [{ at, text: item.text.trim().slice(0, 500) }];
    });
  }
  if (Array.isArray(body.photos)) {
    next.photos = body.photos.slice(0, 40).flatMap((photo) => {
      if (!photo || typeof photo !== "object") return [];
      const p = photo as Partial<ParsedPhoto>;
      if (typeof p.url !== "string" || !p.url.trim()) return [];
      return [
        {
          url: p.url,
          caption: typeof p.caption === "string" ? p.caption : "",
          ...(typeof p.key === "string" && p.key ? { key: p.key } : {}),
        },
      ];
    });
  }
  if (isWatchStatus(body.watchStatus)) next.watchStatus = body.watchStatus;
  if (typeof body.favorite === "boolean") {
    if (body.favorite) next.favorite = true;
    else delete next.favorite;
  }
  if (body.availability === "live" || body.availability === "ended" || body.availability === "unknown") {
    next.availability = body.availability;
  }
  if (typeof body.lastCheckedAt === "string") next.lastCheckedAt = body.lastCheckedAt;
  await putRecord(user.folder, next);
  return Response.json({ listing: next, record: next });
}

export async function DELETE(request: Request, context: Ctx) {
  const user = await currentUser(request);
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
