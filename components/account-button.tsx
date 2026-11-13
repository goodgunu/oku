"use client";

import { useClerk } from "@clerk/nextjs";
import { ConnectBadges, HEADER_PILL } from "@/components/connect-badges";

export function AccountButton({ signedIn = false, clerkActive = false }: { signedIn?: boolean; clerkActive?: boolean }) {
  if (!signedIn) return null;
  return (
    <div className="flex items-center gap-2">
      <ConnectBadges />
      {clerkActive ? <ClerkSignOutButton /> : <CookieSignOutButton />}
    </div>
  );
}

function ClerkSignOutButton() {
  const { signOut } = useClerk();
  async function logout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => undefined);
    try {
      await signOut({ redirectUrl: "/" });
    } catch {
      window.location.href = "/";
    }
  }
  return (
    <button
      type="button"
      onClick={() => void logout()}
      className={`${HEADER_PILL} border border-black/15 bg-white text-black shadow-xs hover:bg-white/90`}
    >
      ログアウト
    </button>
  );
}

function CookieSignOutButton() {
  async function logout() {
    await fetch("/api/auth", { method: "DELETE" }).catch(() => undefined);
    window.location.href = "/";
  }
  return (
    <button
      type="button"
      onClick={() => void logout()}
      className={`${HEADER_PILL} border border-black/15 bg-white text-black shadow-xs hover:bg-white/90`}
    >
      ログアウト
    </button>
  );
}
