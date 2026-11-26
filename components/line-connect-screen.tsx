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

  const connecting = Boolean(code) && message.endsWith("…");
  return (
    <div className="py-10 text-center">
      {connecting && (
        // つないでいる間は、3つの点が順に光る
        <p className="oku-dots mb-3 flex justify-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#06C755]" />
          <span className="size-2.5 rounded-full bg-[#06C755]" />
          <span className="size-2.5 rounded-full bg-[#06C755]" />
        </p>
      )}
      <p key={message} className="motion-crossfade text-sm leading-7 text-muted" role="status">
        {message}
      </p>
    </div>
  );
}
