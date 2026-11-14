import test from "node:test";
import assert from "node:assert/strict";
import {
  detectEvents,
  eventsToQueue,
  isFavoriteListing,
  mergeEvents,
  type NotifyEvent,
} from "../lib/notify";
import type { ArchiveRecord } from "../lib/types";

const NOW = "2026-11-14T00:00:00.000Z";

function listing(overrides: Partial<ArchiveRecord> = {}): ArchiveRecord {
  return {
    id: "u1178000001",
    source: "yahoo-auction",
    sourceUrl: "https://auctions.yahoo.co.jp/jp/auction/u1178000001",
    title: "テスト出品",
    priceYen: 15000,
    priceLabel: "15,000円",
    priceKind: "current_bid",
    availability: "live",
    detailLevel: "full",
    photos: [],
    savedAt: "2026-10-20T00:00:00.000Z",
    updatedAt: "2026-10-28T00:00:00.000Z",
    ...overrides,
  };
}

test("isFavoriteListing は favorite: true のときだけ対象", () => {
  assert.equal(isFavoriteListing(listing({ favorite: true })), true);
  assert.equal(isFavoriteListing(listing({ favorite: false })), false);
  assert.equal(isFavoriteListing(listing({})), false);
  assert.equal(isFavoriteListing(undefined), false);
});

test("detectEvents はお気に入りでなくても値下げと終了を見つける（記録用）", () => {
  const before = listing();
  const drop = detectEvents(before, listing({ priceYen: 12000, priceLabel: "12,000円" }), NOW);
  assert.equal(drop.length, 1);
  assert.equal(drop[0].kind, "drop");
  if (drop[0].kind === "drop") {
    assert.equal(drop[0].fromPrice, "15,000円");
    assert.equal(drop[0].toPrice, "12,000円");
    assert.equal(drop[0].deltaText, "3,000円値下げ");
  }
  const ended = detectEvents(before, listing({ availability: "ended" }), NOW);
  assert.equal(ended.length, 1);
  assert.equal(ended[0].kind, "ended");
  assert.equal(detectEvents(before, listing({ priceYen: 18000, priceLabel: "18,000円" }), NOW).length, 0);
  assert.equal(detectEvents(listing({ availability: "ended" }), listing({ availability: "ended" }), NOW).length, 0);
});

test("eventsToQueue はお気に入りの出品だけLINE待ち行列に乗せる", () => {
  const before = listing();
  const dropped = listing({ priceYen: 12000, priceLabel: "12,000円" });
  const ended = listing({ availability: "ended" });

  assert.deepEqual(eventsToQueue(before, dropped, NOW), []);
  assert.deepEqual(eventsToQueue(before, ended, NOW), []);
  assert.deepEqual(eventsToQueue({ ...before, favorite: false }, { ...dropped, favorite: false }, NOW), []);

  const favDrop = eventsToQueue({ ...before, favorite: true }, { ...dropped, favorite: true }, NOW);
  assert.equal(favDrop.length, 1);
  assert.equal(favDrop[0].kind, "drop");

  const favEnded = eventsToQueue({ ...before, favorite: true }, { ...ended, favorite: true }, NOW);
  assert.equal(favEnded.length, 1);
  assert.equal(favEnded[0].kind, "ended");

  // 確認中にお気に入りフラグが欠けても、確認前がお気に入りなら知らせる
  const kept = eventsToQueue({ ...before, favorite: true }, dropped, NOW);
  assert.equal(kept.length, 1);
  assert.equal(kept[0].kind, "drop");
});

test("同じ出品の値下げは1件にまとめ、終了したら値下げは出さない", () => {
  const first: NotifyEvent = {
    kind: "drop",
    listingId: "u1",
    name: "カメラ",
    fromPrice: "20,000円",
    toPrice: "18,000円",
    deltaText: "2,000円値下げ",
    at: "a",
  };
  const second: NotifyEvent = {
    kind: "drop",
    listingId: "u1",
    name: "カメラ",
    fromPrice: "18,000円",
    toPrice: "15,000円",
    deltaText: "3,000円値下げ",
    at: "b",
  };
  const merged = mergeEvents([first], [second]);
  assert.equal(merged.length, 1);
  if (merged[0].kind === "drop") {
    assert.equal(merged[0].fromPrice, "20,000円");
    assert.equal(merged[0].toPrice, "15,000円");
  }
  const withEnd = mergeEvents(merged, [
    { kind: "ended", listingId: "u1", name: "カメラ", price: "15,000円", at: "c" },
  ]);
  assert.deepEqual(withEnd.map((e) => e.kind), ["ended"]);
});
