import { photoUrl } from "@/lib/account";
import { issueLineLogin } from "@/lib/line-login";
import { buildSavedMessage, type LineMessage } from "@/lib/line-message";
import { fetchListing } from "@/lib/sources";
import { getRecord, saveListing } from "@/lib/store";
import type { ArchiveRecord } from "@/lib/types";

export type SaveReply = { messages: LineMessage[]; record?: ArchiveRecord };

/** URL を指定フォルダに保存して、LINE に返すメッセージを作る。 */
export async function saveAndReply(opts: {
  folder: string;
  url: string;
  origin: string;
  lineUserId?: string;
}): Promise<SaveReply> {
  const { parsed } = await fetchListing(opts.url);
  if (parsed.status === "error") {
    return { messages: [{ type: "text", text: `保存できませんでした。\n${parsed.message}` }] };
  }
  const alreadySaved = Boolean(await getRecord(opts.folder, parsed.listing.id));
  const record = await saveListing(opts.folder, parsed.listing);
  let actionUri: string | undefined;
  if (opts.lineUserId) {
    try {
      const code = await issueLineLogin(opts.lineUserId, `/listings/${record.id}`);
      actionUri = `${opts.origin}/api/auth/line?code=${code}`;
    } catch {
      actionUri = undefined;
    }
  }
  const messages = buildSavedMessage(record, {
    origin: opts.origin,
    ended: parsed.status === "ended",
    alreadySaved,
    heroUrl: photoUrl(opts.origin, opts.folder, record.id, 0),
    actionUri,
  });
  return { messages, record };
}
