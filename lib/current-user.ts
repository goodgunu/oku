import { LEGACY_FOLDER, authEnabled, clerkEnabled, normalizeAccountKey, normalizeEmail, userFolder } from "@/lib/account";
import { resolveEmail } from "@/lib/identity";
import { isLineConflict, linkLineUser, linkedEmail } from "@/lib/line-link";
import { readSessionWithWay } from "@/lib/session";
import { adoptLegacyLibrary } from "@/lib/store";

export type CurrentUser = { email: string; folder: string; via?: "line" };
export type Identity =
  | { state: "anonymous" }
  | { state: "no-data" }
  | { state: "ok"; user: CurrentUser };

export type ClerkLikeUser = {
  primaryEmailAddress?: { emailAddress?: string | null } | null;
  emailAddresses?: Array<{ emailAddress?: string | null }> | null;
  externalAccounts?: Array<{
    provider?: string | null;
    providerUserId?: string | null;
    emailAddress?: string | null;
  }> | null;
};

/**
 * Clerkのユーザー情報から、保存用のアカウント識別子を決める。
 * メールアドレスがあればそれを優先し、Xログインなどでメールが無い場合は
 * `clerk:<userId>` を使う（これでメール無しのSNSログインでもログイン状態が維持される）。
 */
export function resolveClerkAccountKey(
  userId: string | null | undefined,
  user: ClerkLikeUser | null | undefined,
): string {
  const uid = (userId || "").trim();
  if (!uid) return "";
  const primary = normalizeEmail(user?.primaryEmailAddress?.emailAddress || "");
  if (primary) return primary;
  for (const item of user?.emailAddresses || []) {
    const email = normalizeEmail(item?.emailAddress || "");
    if (email) return email;
  }
  for (const ext of user?.externalAccounts || []) {
    const email = normalizeEmail(ext?.emailAddress || "");
    if (email) return email;
  }
  return normalizeAccountKey(`clerk:${uid}`);
}

export async function identity(request?: Request): Promise<Identity> {
  if (!authEnabled()) return { state: "ok", user: { email: "", folder: LEGACY_FOLDER } };

  // 1. Cookie セッション（直接LINEログイン・Yahoo!ログイン・1回コード）を確認
  const cookieSession = await readSessionWithWay(request);
  if (cookieSession) {
    const folder = userFolder(cookieSession.email);
    await adoptLegacyLibrary(folder).catch(() => undefined);
    return {
      state: "ok",
      user: {
        email: cookieSession.email,
        folder,
        ...(cookieSession.via ? { via: cookieSession.via } : {}),
      },
    };
  }

  // 2. Clerk セッションを確認
  if (clerkEnabled()) {
    try {
      const { auth, currentUser: clerkCurrentUser } = await import("@clerk/nextjs/server");
      const { userId } = await auth();
      if (userId) {
        const user = await clerkCurrentUser();
        const lineIds = (user?.externalAccounts || [])
          .filter((a) => String(a.provider) === "line" || String(a.provider) === "oauth_line")
          .map((a) => (a.providerUserId || "").trim())
          .filter(Boolean);
        const resolved = await resolveEmail(user?.primaryEmailAddress?.emailAddress, lineIds, linkedEmail);
        let accountKey = resolved?.email || "";
        if (!accountKey) {
          if (lineIds.length > 0) {
            accountKey = `line:${lineIds[0]}`;
          } else {
            accountKey = resolveClerkAccountKey(userId, user);
          }
        }
        if (accountKey) {
          // Clerk 経由で LINE 外部アカウントがある場合は自動的に links/ にも紐付けておく
          for (const lineId of lineIds) {
            const existing = await linkedEmail(lineId).catch(() => null);
            if (!existing || !isLineConflict(existing, accountKey, lineId)) {
              await linkLineUser(lineId, accountKey).catch(() => undefined);
            }
          }
          const folder = userFolder(accountKey);
          await adoptLegacyLibrary(folder).catch(() => undefined);
          return {
            state: "ok",
            user: {
              email: accountKey,
              folder,
              ...(lineIds.length > 0 || accountKey.startsWith("line:") ? { via: "line" as const } : {}),
            },
          };
        }
      }
    } catch {
      // fall through
    }
  }

  return { state: "anonymous" };
}

/** 未ログイン・データなしは null。 */
export async function currentUser(request?: Request): Promise<CurrentUser | null> {
  const id = await identity(request);
  return id.state === "ok" ? id.user : null;
}

export function unauthorized() {
  return Response.json({ message: "ログインしてください。" }, { status: 401 });
}
