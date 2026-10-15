import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { LEGACY_FOLDER, clerkEnabled, userFolder } from "@/lib/account";
import { resolveEmail } from "@/lib/identity";
import { linkedEmail } from "@/lib/line-link";
import { adoptLegacyLibrary } from "@/lib/store";

export type CurrentUser = { email: string; folder: string };
export type Identity =
  | { state: "anonymous" }
  | { state: "no-data" } // ログイン済みだが、メールもLINE連携も無い（空フォルダは作らない）
  | { state: "ok"; user: CurrentUser };

export async function identity(): Promise<Identity> {
  if (!clerkEnabled()) return { state: "ok", user: { email: "", folder: LEGACY_FOLDER } };
  try {
    const { userId } = await auth();
    if (!userId) return { state: "anonymous" };
    const user = await clerkCurrentUser();
    const lineIds = (user?.externalAccounts || [])
      .filter((a) => String(a.provider) === "line" || String(a.provider) === "oauth_line")
      .map((a) => a.providerUserId || "");
    const resolved = await resolveEmail(user?.primaryEmailAddress?.emailAddress, lineIds, linkedEmail);
    if (!resolved) return { state: "no-data" };
    const folder = userFolder(resolved.email);
    await adoptLegacyLibrary(folder).catch(() => undefined);
    return { state: "ok", user: { email: resolved.email, folder } };
  } catch {
    return { state: "anonymous" };
  }
}

/** 未ログイン・データなしは null。 */
export async function currentUser(): Promise<CurrentUser | null> {
  const id = await identity();
  return id.state === "ok" ? id.user : null;
}

export function unauthorized() {
  return Response.json({ message: "Googleでログインしてください。" }, { status: 401 });
}
