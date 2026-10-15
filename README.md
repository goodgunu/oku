# おく

ヤフオク（Yahoo!オークション）の出品ページを、終了前に自分用のメモとして残す個人アプリです。

カーセンサー版の「のこす」の姉妹アプリとして、まずは別アプリで動かします。あとから統合もできます。

> 個人利用向けです。Yahoo!オークション公式ではありません。一括収集や商用スクレイピングは想定していません。自分が開いた／LINEで共有した **1件の詳細URL** だけを保存します。

## できること（MVP）

- 出品URLを貼って保存（タイトル、現在価格、入札数、出品者、終了日時、説明、写真URL）
- ライブラリ一覧と詳細ページ
- LINE Webhook の骨組み（公式アカウントにURLを送ると保存して返信）

## 動かし方

```bash
cd oku
cp .env.example .env.local   # 必要なら編集
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

```bash
npm test          # URL正規化・パーサのテスト
npm run build     # 本番ビルド
```

データはローカルの `.data/records/me/` に JSON で保存されます（`OKU_DATA_DIR` で変更可）。

## 環境変数

| 変数 | 説明 |
| --- | --- |
| `LINE_CHANNEL_SECRET` | LINE Messaging API のチャネルシークレット（署名検証） |
| `LINE_CHANNEL_ACCESS_TOKEN` | 返信用アクセストークン |
| `OKU_DATA_DIR` | 保存ディレクトリ（省略時 `./.data`） |
| `R2_ACCOUNT_ID` / `R2_BUCKET` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Cloudflare R2。4つ揃うと記録（`records/me/<id>.json`）と写真（`photos/<id>/<番号>.<拡張子>`）を R2 に保存。未設定なら `.data` |

## LINE 連携（任意）

1. [LINE Developers](https://developers.line.biz/) で Messaging API チャネルを作る
2. Webhook URL を `https://<あなたのドメイン>/api/line` にする
3. `LINE_CHANNEL_SECRET` と `LINE_CHANNEL_ACCESS_TOKEN` を Vercel / `.env.local` に入れる
4. ヤフオクの出品画面から「共有」→ LINE で公式アカウントへ送る

開発中でシークレット未設定の場合、署名検証はスキップします（本番では必ず設定してください）。

## 技術メモ

- Next.js App Router + TypeScript + Tailwind CSS v4
- パーサは出品ページの `__NEXT_DATA__`（`item.detail.item`）を優先し、無いとき OGP にフォールバック
- R2 設定時は保存時に写真（最大20枚・1枚10MBまで）をダウンロードして R2 に保存し、`/api/photo/<id>/<番号>` から表示。失敗した写真は元URLのまま

## 今後（のこすとくっつけるとき）

- 認証（Clerk など）とユーザー別ストア
- 価格の再チェック / 比較UI
- 「のこす」本体への統合
