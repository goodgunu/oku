import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { LEGACY_FOLDER, clerkEnabled, normalizeEmail, userFolder } from "@/lib/account";
import { adoptLegacyLibrary } from "@/lib/store";

export type CurrentUser = { email: string; folder: string };

/**
 * ログイン中のユーザー。Clerk のキーが無いときは従来どおり共有フォルダ "me" で動かす（ログインなし）。
 * 未ログインなら null。
 */
export async function currentUser(): Promise<CurrentUser | null> {
  if (!clerkEnabled()) return { email: "", folder: LEGACY_FOLDER };
  try {
    const { userId } = await auth();
    if (!userId) return null;
    const user = await clerkCurrentUser();
    const email = normalizeEmail(user?.primaryEmailAddress?.emailAddress || "");
    if (!email) return null;
    const folder = userFolder(email);
    await adoptLegacyLibrary(folder).catch(() => undefined);
    return { email, folder };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ message: "Googleでログインしてください。" }, { status: 401 });
}
