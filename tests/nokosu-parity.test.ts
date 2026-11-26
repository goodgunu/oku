import test from "node:test";
import assert from "node:assert/strict";
import { normalizeAccountKey } from "../lib/account";
import { messageFromClerkXError, X_ALREADY_USED_MESSAGE } from "../lib/clerk-x-errors";
import { resolveClerkAccountKey } from "../lib/current-user";
import { COMPARE_ROWS, bestIds } from "../lib/compare-rows";
import { matchesQuery, sourceCounts } from "../lib/library-filter";
import { endedPriceHeading, formatRemainingTime } from "../lib/format";
import { sortListings } from "../lib/library-sort";
import { digestText } from "../lib/notify";
import { priceHistoryAfter, priceChange } from "../lib/price-history";
import { publicListingOf } from "../lib/share";
import { lineAccountId } from "../lib/line-oauth";
import { isLineConflict } from "../lib/line-link";
import type { ArchiveRecord } from "../lib/types";

const sampleRecord = (overrides: Partial<ArchiveRecord> = {}): ArchiveRecord => ({
  id: "u1178000001",
  source: "yahoo-auction",
  sourceUrl: "https://auctions.yahoo.co.jp/jp/auction/u1178000001",
  title: "テスト出品",
  priceYen: 15000,
  priceLabel: "15,000円",
  priceKind: "current_bid",
  buyNowYen: 20000,
  bidCount: 3,
  seller: "secret_seller",
  condition: "目立った傷や汚れなし",
  shipping: "送料無料",
  prefecture: "東京都",
  category: "家電",
  endTimeLabel: "10/30 22:00",
  postedAt: null,
  description: "説明テキスト",
  availability: "live",
  detailLevel: "full",
  photos: [{ url: "https://example.com/1.jpg", key: "photos/0.jpg" }],
  savedAt: "2026-10-20T00:00:00.000Z",
  updatedAt: "2026-10-28T00:00:00.000Z",
  memo: "非公開メモ",
  ...overrides,
});

test("normalizeAccountKey supports email and provider keys", () => {
  assert.equal(normalizeAccountKey("  User@Example.com "), "user@example.com");
  assert.equal(normalizeAccountKey("line:U1234567890abcdef"), "line:U1234567890abcdef");
  assert.equal(normalizeAccountKey("clerk:user_abc123"), "clerk:user_abc123");
  assert.equal(normalizeAccountKey("yahoo:y_sub_1"), "yahoo:y_sub_1");
  assert.equal(normalizeAccountKey("invalid"), "");
});

test("lineAccountId formats line:<sub> and isLineConflict allows self-link override", () => {
  assert.equal(lineAccountId("Uabcdef123456"), "line:Uabcdef123456");
  // Self-linked line:<sub> can be linked to user@example.com without conflict
  assert.equal(isLineConflict("line:Uabcdef123456", "user@example.com", "Uabcdef123456"), false);
  // Linked to another email conflicts
  assert.equal(isLineConflict("other@example.com", "user@example.com", "Uabcdef123456"), true);
});

test("resolveClerkAccountKey falls back to clerk:<userId> when email and LINE link are absent", () => {
  const key = resolveClerkAccountKey("user_2xyz987", {
    primaryEmailAddress: null,
    emailAddresses: [],
    externalAccounts: [{ provider: "oauth_x", providerUserId: "x_999" }],
  });
  assert.equal(key, "clerk:user_2xyz987");
});

test("messageFromClerkXError returns Japanese duplicate message for external_account_exists", () => {
  const err = { errors: [{ code: "external_account_exists", message: "Already exists" }] };
  assert.equal(messageFromClerkXError(err, X_ALREADY_USED_MESSAGE), X_ALREADY_USED_MESSAGE);
});

test("priceHistoryAfter tracks changes and priceChange computes delta", () => {
  const initial = sampleRecord({ priceYen: 20000, priceLabel: "20,000円", priceHistory: undefined });
  const h2 = priceHistoryAfter(initial, "18,000円", 18000, "2026-10-28T00:00:00.000Z");
  assert.equal(h2.length, 2);
  const change = priceChange(sampleRecord({ priceYen: 18000, priceLabel: "18,000円", priceHistory: h2 }));
  assert.ok(change);
  assert.equal(change.direction, "down");
  assert.equal(change.deltaYen, -2000);
  assert.equal(change.deltaText, "2,000円値下げ");

  const h3 = priceHistoryAfter(initial, "22,000円", 22000, "2026-10-29T00:00:00.000Z");
  const up = priceChange(sampleRecord({ priceYen: 22000, priceLabel: "22,000円", priceHistory: h3 }));
  assert.ok(up);
  assert.equal(up.direction, "up");
  assert.equal(up.deltaYen, 2000);
  assert.equal(up.deltaText, "2,000円アップ");
});

test("digestText formats おくからのお知らせ", () => {
  const msg = digestText(
    [
      {
        kind: "drop",
        listingId: "u1",
        name: "カメラレンズ",
        fromPrice: "20,000円",
        toPrice: "18,000円",
        deltaText: "2,000円値下げ",
        at: "2026-10-28T00:00:00.000Z",
      },
      {
        kind: "ended",
        listingId: "u2",
        name: "三脚",
        price: "5,000円",
        at: "2026-10-28T00:00:00.000Z",
      },
    ],
    "https://oku-bice.vercel.app",
    new Date("2026-10-28T09:00:00+09:00"),
  );
  assert.ok(msg);
  assert.ok(msg.includes("おくからのお知らせ（10月28日）"));
  assert.ok(msg.includes("【値下げ】1件"));
  assert.ok(msg.includes("【終了】1件"));
});

test("COMPARE_ROWS bestIds highlights cheapest listing", () => {
  const r1 = sampleRecord({ id: "u1", priceYen: 15000 });
  const r2 = sampleRecord({ id: "u2", priceYen: 12000 });
  const priceRow = COMPARE_ROWS.find((r) => r.label === "価格")!;
  const best = bestIds([r1, r2], priceRow);
  assert.deepEqual([...best], ["u2"]);
});

test("sourceCounts and sortListings work with favorites and price", () => {
  const r1 = sampleRecord({ id: "u1", priceYen: 15000, favorite: false });
  const r2 = sampleRecord({ id: "u2", priceYen: 12000, favorite: true, title: "特別カメラ" });
  assert.equal(matchesQuery(r2, "特別"), true);
  const counts = sourceCounts([r1, r2], "all", "", true);
  assert.equal(counts.all, 1);

  const sorted = sortListings([r1, r2], { key: "price", dir: "asc" });
  assert.deepEqual(sorted.map((r) => r.id), ["u2", "u1"]);
});

test("publicListingOf omits private memo and seller", () => {
  const pub = publicListingOf(sampleRecord());
  assert.equal(pub.name, "テスト出品");
  assert.equal("memo" in pub, false);
  assert.equal("seller" in pub, false);
});

test("formatRemainingTime, endedPriceHeading, and ending-asc sort work", () => {
  const now = Date.parse("2026-11-26T12:00:00.000Z");
  assert.deepEqual(formatRemainingTime("2026-11-26T12:45:00.000Z", now), { label: "あと45分", urgent: true });
  assert.deepEqual(formatRemainingTime("2026-11-26T15:30:00.000Z", now), { label: "あと3時間", urgent: false });
  assert.deepEqual(formatRemainingTime("2026-11-28T15:00:00.000Z", now), { label: "あと2日", urgent: false });
  assert.equal(formatRemainingTime("2026-11-26T11:00:00.000Z", now), null);

  assert.equal(endedPriceHeading({ source: "yahoo-auction", bidCount: 3 }), "落札価格");
  assert.equal(endedPriceHeading({ source: "yahoo-auction", bidCount: 0 }), "最終価格");
  assert.equal(endedPriceHeading({ source: "mercari", bidCount: null }), "最終価格");

  const soon = sampleRecord({ id: "soon", availability: "live", endTime: "2026-11-26T13:00:00.000Z" });
  const later = sampleRecord({ id: "later", availability: "live", endTime: "2026-11-27T13:00:00.000Z" });
  const ended = sampleRecord({ id: "ended", availability: "ended", endTime: "2026-11-26T12:30:00.000Z" });
  const noEnd = sampleRecord({ id: "noEnd", availability: "live", endTime: "" });
  const ordered = sortListings([ended, later, noEnd, soon], { key: "ending", dir: "asc" }, now);
  assert.deepEqual(
    ordered.map((x) => x.id),
    ["soon", "later", "ended", "noEnd"],
  );
});

test("changed-desc sort puts price-changed and ended items first", () => {
  const unchanged = sampleRecord({
    id: "unchanged",
    availability: "live",
    updatedAt: "2026-11-26T10:00:00.000Z",
    priceHistory: [{ at: "2026-11-25T00:00:00.000Z", priceLabel: "15,000円", priceYen: 15000 }],
  });
  const dropped = sampleRecord({
    id: "dropped",
    availability: "live",
    updatedAt: "2026-11-26T08:00:00.000Z",
    priceHistory: [
      { at: "2026-11-25T00:00:00.000Z", priceLabel: "15,000円", priceYen: 15000 },
      { at: "2026-11-26T08:00:00.000Z", priceLabel: "13,000円", priceYen: 13000 },
    ],
  });
  const ended = sampleRecord({
    id: "ended",
    availability: "ended",
    updatedAt: "2026-11-26T09:00:00.000Z",
  });
  const ordered = sortListings([unchanged, dropped, ended], { key: "changed", dir: "desc" });
  assert.deepEqual(
    ordered.map((x) => x.id),
    ["ended", "dropped", "unchanged"],
  );
});
