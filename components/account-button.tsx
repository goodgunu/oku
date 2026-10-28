"use client";

import { useClerk } from "@clerk/nextjs";
import { ConnectBadges } from "@/components/connect-badges";

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
      className="inline-flex h-8 items-center rounded-full border border-black/30 bg-white/80 px-3 text-xs font-bold text-ink hover:bg-white"
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
      className="inline-flex h-8 items-center rounded-full border border-black/30 bg-white/80 px-3 text-xs font-bold text-ink hover:bg-white"
    >
      ログアウト
    </button>
  );
}
