import { currentUser, unauthorized } from "@/lib/current-user";
import { fetchYahooListing } from "@/lib/fetch-listing";
import { saveListing } from "@/lib/store";

export const maxDuration = 60;

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  try {
    let body: { url?: unknown };
    try {
      body = await request.json();
    } catch {
      return Response.json({ status: "error", message: "URLを読み取れませんでした。" }, { status: 400 });
    }

    if (typeof body.url !== "string") {
      return Response.json(
        { status: "error", message: "ヤフオクの出品ページのURLを貼ってください。" },
        { status: 400 },
      );
    }

    const { parsed, httpStatus } = await fetchYahooListing(body.url);

    if (parsed.status === "error") {
      return Response.json(parsed, { status: httpStatus });
    }

    const record = await saveListing(user.folder, parsed.listing);
    return Response.json(
      { status: parsed.status, listing: parsed.listing, record },
      { status: 200 },
    );
  } catch {
    return Response.json(
      { status: "error", message: "保存処理が途中で止まったので、もう一度試してください。" },
      { status: 500 },
    );
  }
}
