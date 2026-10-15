"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function LineConnectScreen({ code }: { code: string }) {
  const router = useRouter();
  const [message, setMessage] = useState(
    code ? "アカウントをつないで、保存しています…" : "このリンクは使えません。LINEの「おく」から、もう一度URLを送ってください。",
  );

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    fetch("/api/line/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { href?: string; message?: string };
        if (cancelled) return;
        if (!response.ok) {
          setMessage(data.message || "つなげませんでした。LINEの「おく」から、もう一度URLを送ってください。");
          return;
        }
        if (data.href) {
          router.replace(data.href);
          return;
        }
        setMessage(data.message || "保存できませんでした。");
      })
      .catch(() => {
        if (!cancelled) setMessage("つなげませんでした。通信を確認して、もう一度ひらいてください。");
      });
    return () => {
      cancelled = true;
    };
  }, [code, router]);

  return <p className="py-10 text-center text-sm leading-7 text-muted">{message}</p>;
}
