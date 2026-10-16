import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { extractListingUrl, isListingId, unsupportedMessage } from "../lib/sources";
import { parseJmtyHtml } from "../lib/sources/jmty";
import { cleanMercariTitle, parseMercariHtml } from "../lib/sources/mercari";
import { parsePaypayHtml } from "../lib/sources/paypay";
import { prefectureFromEnum } from "../lib/sources/prefectures";
import { classify } from "../lib/classify";
import { buildSavedMessage } from "../lib/line-message";
import { normalizeRecord, listingToRecord } from "../lib/store";

const fx = (n: string) => readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", n), "utf8");

describe("registry", () => {
  it("extracts each site", () => {
    assert.equal(extractListingUrl("https://auctions.yahoo.co.jp/jp/auction/h1248094934")?.id, "h1248094934");
    const pp = extractListingUrl("見て https://paypayfleamarket.yahoo.co.jp/item/z632124618?x=1 です");
    assert.equal(pp?.id, "pp_z632124618");
    assert.equal(pp?.canonicalUrl, "https://paypayfleamarket.yahoo.co.jp/item/z632124618");
    const jm = extractListingUrl("https://jmty.jp/kanagawa/sale-ele/article-h8cpm?from=pr");
    assert.equal(jm?.id, "jm_h8cpm");
    assert.equal(jm?.canonicalUrl, "https://jmty.jp/kanagawa/sale-ele/article-h8cpm");
    const mc = extractListingUrl("https://jp.mercari.com/item/m53988257465?afid=1");
    assert.equal(mc?.id, "mc_m53988257465");
    assert.equal(mc?.source.id, "mercari");
    assert.equal(extractListingUrl("jp.mercari.com/item/m53988257465")?.source.id, "mercari");
  });
  it("picks the first URL and rejects unsupported", () => {
    const t = "https://jmty.jp/tokyo/sale-ele/article-abc12 https://jp.mercari.com/item/m11111111111";
    assert.equal(extractListingUrl(t)?.source.id, "jmty");
    assert.equal(extractListingUrl("https://example.com/item/m11111111111"), null);
    assert.match(unsupportedMessage(), /ヤフオク.*PayPayフリマ.*ジモティー.*メルカリ/);
  });
  it("ids do not collide and old ids stay valid", () => {
    for (const id of ["h1248094934", "1234567890", "pp_z632124618", "jm_h8cpm", "mc_m53988257465"]) assert.ok(isListingId(id), id);
    assert.ok(!isListingId("../x") && !isListingId("pp_x"));
  });
});

describe("paypay", () => {
  it("parses sold item", () => {
    const r = parsePaypayHtml(fx("paypay-sold.html"), "https://paypayfleamarket.yahoo.co.jp/item/z632124618");
    assert.equal(r.status, "ended");
    if (r.status === "error") return;
    const l = r.listing;
    assert.equal(l.id, "pp_z632124618");
    assert.equal(l.source, "paypay");
    assert.equal(l.priceYen, 28000);
    assert.equal(l.priceKind, "fixed");
    assert.equal(l.prefecture, "茨城県");
    assert.equal(l.availability, "ended");
    assert.equal(l.photos.length, 5);
    assert.equal(l.condition, "目立った傷や汚れなし");
    assert.match(l.shipping, /ヤマト.*2〜3日/);
    assert.ok(l.seller);
    assert.equal(l.bidCount, null);
  });
  it("maps prefectures", () => {
    assert.equal(prefectureFromEnum("OKAYAMA"), "岡山県");
    assert.equal(prefectureFromEnum("TOKYO"), "東京都");
    assert.equal(prefectureFromEnum("nope"), "");
  });
  it("live when not SOLD", () => {
    const html = fx("paypay-sold.html").replace('"status":"SOLD"', '"status":"OPEN"');
    const r = parsePaypayHtml(html, "https://paypayfleamarket.yahoo.co.jp/item/z632124618");
    assert.equal(r.status, "ok");
  });
});

describe("jmty", () => {
  it("parses article", () => {
    const r = parseJmtyHtml(fx("jmty-live.html"), "https://jmty.jp/kanagawa/sale-ele/article-h8cpm");
    assert.equal(r.status, "ok");
    if (r.status === "error") return;
    const l = r.listing;
    assert.equal(l.id, "jm_h8cpm");
    assert.equal(l.priceYen, 20000);
    assert.equal(l.priceKind, "fixed");
    assert.equal(l.prefecture, "神奈川県川崎市");
    assert.equal(l.photos.length, 4);
    assert.match(l.photos[0].url, /^https:\/\/cdn\.jmty\.jp\//);
    assert.equal(l.seller, "エコリッチストア");
    assert.match(l.category || "", /家電/);
    assert.ok(l.postedAt);
  });
  it("free and closed", () => {
    const free = fx("jmty-live.html").replace('"important_field":"20,000円"', '"important_field":"0円"').replace('"closed":false', '"closed":true');
    const r = parseJmtyHtml(free, "https://jmty.jp/kanagawa/sale-ele/article-h8cpm");
    assert.equal(r.status, "ended");
    if (r.status === "error") return;
    assert.equal(r.listing.priceKind, "free");
    assert.equal(r.listing.priceLabel, "無料");
  });
});

describe("mercari", () => {
  it("light mode title and first photo", () => {
    const r = parseMercariHtml(fx("mercari-ok.html"), "https://jp.mercari.com/item/m53988257465");
    assert.equal(r.status, "ok");
    if (r.status === "error") return;
    assert.equal(r.listing.title, "Nintendo Switch（有機ELモデル） ニンテンドースイッチ 本体");
    assert.equal(r.listing.availability, "unknown");
    assert.equal(r.listing.detailLevel, "partial");
    assert.match(r.listing.photos[0].url, /static\.mercdn\.net.*m53988257465_1\.jpg/);
    assert.equal(r.listing.priceYen, null);
  });
  it("generic/blocked page is an error", () => {
    assert.equal(parseMercariHtml(fx("mercari-generic.html"), "https://jp.mercari.com/item/m68528641575").status, "error");
  });
  it("strips suffixes", () => {
    assert.equal(cleanMercariTitle("abc by メルカリ"), "abc");
    assert.equal(cleanMercariTitle("abc - メルカリ"), "abc");
  });
});

describe("records and ui logic", () => {
  it("legacy records default to yahoo-auction; unknown counts as live", () => {
    const old = { id: "h1248094934", availability: "unknown", endTime: "" } as never;
    const n = normalizeRecord(old);
    assert.equal(n.source, "yahoo-auction");
    assert.equal(n.detailLevel, "full");
    assert.equal(classify(n), "live");
  });
  it("line card adapts per site", () => {
    const r = parseMercariHtml(fx("mercari-ok.html"), "https://jp.mercari.com/item/m53988257465");
    if (r.status === "error") return assert.fail();
    const rec = listingToRecord(r.listing);
    const [m] = buildSavedMessage(rec, { origin: "https://x.test" });
    const json = JSON.stringify(m);
    assert.match(json, /メルカリ/);
    assert.match(json, /タイトルと写真のみ/);
    assert.ok(!/入札|現在価格/.test(json));
    assert.match(json, /おくで見る/);
    assert.match(json, /#ffdc00/);
    const p = parsePaypayHtml(fx("paypay-sold.html"), "https://paypayfleamarket.yahoo.co.jp/item/z632124618");
    if (p.status === "error") return assert.fail();
    const j2 = JSON.stringify(buildSavedMessage(listingToRecord(p.listing), { origin: "https://x.test" }));
    assert.match(j2, /価格: 28,000円/);
    assert.ok(!/現在価格|入札/.test(j2));
  });
});
