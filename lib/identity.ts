import { normalizeAccountKey, normalizeEmail } from "@/lib/account";

export const NEEDS_GOOGLE_MESSAGE = "LINEにメールがないため、先にGoogleでログインしてください";

export type EmailResolution = { email: string; source: "primary" | "line-link" } | null;

/** 保存データの持ち主のメール（またはアカウント識別子）を決める。主メールがあれば最優先、なければ LINE の外部アカウントIDから links/ を引く。 */
export async function resolveEmail(
  primaryEmail: string | null | undefined,
  lineProviderUserIds: string[],
  lookup: (lineUserId: string) => Promise<string | null>,
): Promise<EmailResolution> {
  const primary = normalizeEmail(primaryEmail || "");
  if (primary) return { email: primary, source: "primary" };
  for (const id of lineProviderUserIds) {
    if (!id) continue;
    const linked = normalizeAccountKey((await lookup(id).catch(() => null)) || "");
    if (linked) return { email: linked, source: "line-link" };
  }
  return null;
}
