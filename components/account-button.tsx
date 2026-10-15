"use client";

import { useClerk, useUser } from "@clerk/nextjs";

export function AccountButton() {
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  if (!isSignedIn) return null;
  return (
    <button
      type="button"
      onClick={() => void signOut({ redirectUrl: "/" })}
      className="rounded-full border border-black/30 px-3 py-1 text-xs font-bold text-ink"
    >
      ログアウト
    </button>
  );
}
