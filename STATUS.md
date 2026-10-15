# おく — 現状

作成日: 2026-10-15（Asia/Tokyo）

## 動くもの

- Next.js 16 + React 19 + Tailwind 4 のアプリ一式（`/workspace/oku`）
- `lib/yahoo-url.ts` … 出品URL正規化・テキストから抽出
- `lib/parse-yahoo.ts` … `__NEXT_DATA__` / OGP パーサ（live / ended / error）
- `lib/fetch-listing.ts` … 1件取得
- `.data` ファイルストア（単一ユーザー `me`）
- UI: `/`（URL貼り付け＋一覧）、`/listings/[id]`（詳細）
- API: `POST /api/archive`、`GET /api/library`、`GET|DELETE /api/library/[id]`
- LINE Webhook 骨組み: `POST /api/line`
- `npm test` 用フィクスチャ（live / ended / og-only）

## 未設定・次のステップ

1. **LINE** … `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN` を入れ、公開URLの `/api/line` を Webhook に登録
2. **デプロイ** … Vercel 等へ。サーバレスでは `.data` が揮発するので、Blob / DB への移行が必要
3. **認証** … 今はローカル単一ストア。Clerk 等はスキップ済み
4. **写真再ホスト** … 元URLのまま（期限切れのリスクあり）
5. **のこす統合** … 別アプリとして成立後、共有レイヤ（ストア・LINE・UI）を合併

## 注意

- ヤフオクは自動収集を制限しています。本アプリはユーザーが渡した単一詳細URLのみ処理します
- サンドボックスから実ページ fetch は環境によって失敗し得ます。パーサはフィクスチャで検証済み
