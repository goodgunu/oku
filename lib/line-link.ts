import { lineLinkKey, lineRevKey, normalizeAccountKey, safeLineUserId } from "@/lib/account";
import { listLineLinkNames, readAppJson, writeAppJson } from "@/lib/store";

export type LineLink = { lineUserId: string; email: string; linkedAt: string };
type LineRev = { lineUserId: string; email: string; linkedAt: string };

export async function linkedEmail(lineUserId: string): Promise<string | null> {
  if (!safeLineUserId(lineUserId)) return null;
  const record = await readAppJson<LineLink>(lineLinkKey(lineUserId));
  return record?.email && normalizeAccountKey(record.email) ? normalizeAccountKey(record.email) : null;
}

export async function linkLineUser(lineUserId: string, accountKey: string): Promise<void> {
  const normalized = normalizeAccountKey(accountKey);
  if (!safeLineUserId(lineUserId) || !normalized) throw new Error("LINEとアカウントを結びつけられません。");
  const linkedAt = new Date().toISOString();
  const record: LineLink = { lineUserId, email: normalized, linkedAt };
  await writeAppJson(lineLinkKey(lineUserId), record);
  const rev: LineRev = { lineUserId, email: normalized, linkedAt };
  await writeAppJson(lineRevKey(normalized), rev);
}

/**
 * LINEログインだけで作られた自己紐付け（`line:<lineUserId>`）は、
 * 後から別アカウント（Google・メール・X等）へ「LINE連携」するときに上書き可能とする。
 * それ以外の別アカウントに紐づいている場合のみ競合（true）とみなす。
 */
export function isLineConflict(
  existingAccount: string | null | undefined,
  targetAccount: string,
  lineUserId: string,
): boolean {
  const existing = normalizeAccountKey(existingAccount || "");
  const target = normalizeAccountKey(targetAccount);
  if (!existing) return false;
  if (existing === target) return false;
  if (existing === `line:${lineUserId.trim()}`) return false;
  return true;
}

function selfLineUserId(accountKey: string): string | null {
  if (!accountKey.startsWith("line:")) return null;
  const id = accountKey.slice("line:".length).trim();
  return safeLineUserId(id) ? id : null;
}

export async function isLineLinkedEmail(accountKey: string): Promise<boolean> {
  const normalized = normalizeAccountKey(accountKey);
  if (!normalized) return false;
  if (selfLineUserId(normalized)) return true;
  const rev = await readAppJson<LineRev>(lineRevKey(normalized));
  if (rev?.lineUserId) return true;
  const names = await listLineLinkNames();
  for (const name of names) {
    const rec = await readAppJson<LineLink>(`links/${name}`);
    if (rec && normalizeAccountKey(rec.email) === normalized && safeLineUserId(rec.lineUserId)) {
      await writeAppJson(lineRevKey(normalized), {
        lineUserId: rec.lineUserId,
        email: normalized,
        linkedAt: rec.linkedAt,
      });
      return true;
    }
  }
  return false;
}

export async function linkedLineUserId(accountKey: string): Promise<string | null> {
  const normalized = normalizeAccountKey(accountKey);
  if (!normalized) return null;
  const rev = await readAppJson<LineRev>(lineRevKey(normalized));
  if (rev?.lineUserId && safeLineUserId(rev.lineUserId)) return rev.lineUserId;
  const names = await listLineLinkNames();
  for (const name of names) {
    const rec = await readAppJson<LineLink>(`links/${name}`);
    if (rec && normalizeAccountKey(rec.email) === normalized && safeLineUserId(rec.lineUserId)) {
      await writeAppJson(lineRevKey(normalized), {
        lineUserId: rec.lineUserId,
        email: normalized,
        linkedAt: rec.linkedAt,
      });
      return rec.lineUserId;
    }
  }
  return selfLineUserId(normalized);
}
