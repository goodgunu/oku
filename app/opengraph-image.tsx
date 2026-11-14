import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "おく　気になった出品を、消える前に残す。";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// OGP画像（トップページ）。日本語は、使う文字だけに絞ったNoto Sans JPで描く（assets/og-font.otf）。
export default async function OpengraphImage() {
  const root = process.cwd();
  const [font, wordmark, photo] = await Promise.all([
    readFile(path.join(root, "assets/og-font.otf")),
    readFile(path.join(root, "public/wordmark.png")),
    readFile(path.join(root, "public/samples/enkei-rpf1.jpg")),
  ]);
  const wordmarkSrc = `data:image/png;base64,${wordmark.toString("base64")}`;
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#ffdc00",
          fontFamily: "NotoSansJP",
          color: "#111111",
          padding: "56px 64px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={wordmarkSrc} width={203} height={80} alt="" />
          <div style={{ display: "flex", flexDirection: "column", marginTop: 44, fontSize: 64, lineHeight: 1.25, fontWeight: 700, letterSpacing: "-0.01em" }}>
            <span>気になった出品を、</span>
            <span>消える前に残す。</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 26, fontSize: 28, lineHeight: 1.5, color: "rgba(0,0,0,0.78)" }}>
            <span>URLを貼るか、LINEに送るだけ。</span>
            <span>価格も写真も、自分のアカウントに残ります。</span>
          </div>
          <div style={{ display: "flex", marginTop: "auto", gap: 10 }}>
            {["ヤフオク", "メルカリ", "PayPayフリマ", "ジモティー"].map((site) => (
              <span
                key={site}
                style={{ display: "flex", background: "#ffffff", borderRadius: 999, padding: "8px 18px", fontSize: 22, fontWeight: 700 }}
              >
                {site}
              </span>
            ))}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 330,
            background: "#ffffff",
            borderRadius: 28,
            overflow: "hidden",
            boxShadow: "0 18px 40px rgba(0,0,0,0.18)",
            alignSelf: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoSrc} width={330} height={300} style={{ objectFit: "cover" }} alt="" />
          <div style={{ display: "flex", flexDirection: "column", padding: "18px 22px 22px", borderTop: "4px solid #ffdc00" }}>
            <span style={{ fontSize: 18, color: "#666666" }}>ヤフオク · ホイール</span>
            <span style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>ENKEI RPF1RS 18x9.5J+12</span>
            <div style={{ display: "flex", alignItems: "baseline", marginTop: 10 }}>
              <span style={{ fontSize: 16, color: "#666666", marginRight: 8 }}>現在価格</span>
              <span style={{ fontSize: 34, fontWeight: 700 }}>81,000</span>
              <span style={{ fontSize: 18, fontWeight: 700, marginLeft: 2 }}>円</span>
            </div>
            <span
              style={{ display: "flex", alignSelf: "flex-start", marginTop: 10, background: "#E7F6EC", color: "#05813A", borderRadius: 999, padding: "4px 14px", fontSize: 18, fontWeight: 700 }}
            >
              5,000円値下げ
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "NotoSansJP", data: font, weight: 700, style: "normal" }],
    },
  );
}
