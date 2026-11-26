import type { MetadataRoute } from "next";

// ホーム画面に追加した時の名前・色・アイコン（色は globals.css の --yahoo / --background）
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "おく｜気になった出品を、消える前に残す",
    short_name: "おく",
    description:
      "ヤフオク・メルカリ・PayPayフリマ・ジモティーの出品を、落札や掲載終了で消える前に自分のアカウントへ残すメモ。URLを貼るか、LINEの「おく」に送るだけ。お気に入りに登録した出品の値下げや終了はLINEでお知らせします。",
    lang: "ja",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7f7f7",
    theme_color: "#ffdc00",
    icons: [
      { src: "/icon.png", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/mark.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
