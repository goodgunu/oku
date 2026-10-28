"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { publishAuthNotice } from "@/components/auth-notice";
import { messageFromClerkXError, X_ALREADY_USED_MESSAGE } from "@/lib/clerk-x-errors";

const REDIRECT = {
  signInUrl: "/",
  signUpUrl: "/",
  continueSignUpUrl: "/",
  signInForceRedirectUrl: "/",
  signUpForceRedirectUrl: "/",
  signInFallbackRedirectUrl: "/",
  signUpFallbackRedirectUrl: "/",
  transferable: true,
} as const;

export default function SsoCallbackPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted">
        <p role="status">ログインを完了しています…</p>
      </main>
    );
  }
  return <SsoCallbackInner />;
}

function SsoCallbackInner() {
  const clerk = useClerk();
  const [note, setNote] = useState("ログインを完了しています…");

  useEffect(() => {
    if (!clerk.loaded) return;
    let cancelled = false;
    void (async () => {
      try {
        await clerk.handleRedirectCallback({ ...REDIRECT });
      } catch (error) {
        if (cancelled) return;
        const message = messageFromClerkXError(error, X_ALREADY_USED_MESSAGE);
        publishAuthNotice(message);
        setNote(message);
        window.setTimeout(() => {
          window.location.replace("/");
        }, 800);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clerk, clerk.loaded]);

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center text-sm text-muted">
      <p role="status">{note}</p>
    </main>
  );
}
