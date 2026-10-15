import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSavedMessage } from "../lib/line-message";
import type { ArchiveRecord } from "../lib/types";

const rec = {
  id: "b1243771302", title: "テスト商品", priceLabel: "1,000円", bidCount: 2, seller: "店", endTimeLabel: "10月15日", buyNowYen: 5000,
  photos: [{ url: "http://x/y.jpg", caption: "", key: "photos/b1243771302/0.jpg" }],
} as unknown as ArchiveRecord;

test("flex message has button, hero and link in altText", () => {
  const [m] = buildSavedMessage(rec, { origin: "https://oku-bice.vercel.app", ended: true });
  assert.equal(m.type, "flex");
  if (m.type !== "flex") return;
  const json = JSON.stringify(m.contents);
  assert.match(json, /おくで見る/);
  assert.match(json, /https:\/\/oku-bice\.vercel\.app\/listings\/b1243771302/);
  assert.match(json, /https:\/\/oku-bice\.vercel\.app\/api\/photo\/b1243771302\/0/);
  assert.match(m.altText, /listings\/b1243771302/);
  assert.match(m.altText, /終了済み/);
});

test("no hero without saved photo; already saved label", () => {
  const [m] = buildSavedMessage({ ...rec, photos: [] }, { origin: "https://a.b", alreadySaved: true });
  assert.ok(m.type === "flex" && !JSON.stringify(m.contents).includes("hero") && m.altText.includes("保存済み"));
});
