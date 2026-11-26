import type { MetadataRoute } from "next";

const SITE_URL = "https://oku-bice.vercel.app";

// ログインしなくても見られるページだけ（一覧・詳細・比較・LINE連携はログインが必要、共有ページ /s/* は noindex）
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.3 },
  ];
}
