import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { parseYahooHtml } from "../lib/parse-yahoo";

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

describe("parseYahooHtml", () => {
  it("parses live listing from __NEXT_DATA__", () => {
    const html = readFileSync(path.join(fixtures, "yahoo-live.html"), "utf8");
    const result = parseYahooHtml(html, "https://auctions.yahoo.co.jp/jp/auction/h1248094934");
    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;
    assert.equal(result.listing.id, "h1248094934");
    assert.match(result.listing.title, /バッテリー/);
    assert.equal(result.listing.priceYen, 9337);
    assert.equal(result.listing.availability, "live");
    assert.equal(result.listing.seller, "ぐっぷらドットコム");
    assert.ok(result.listing.photos.length >= 1);
    assert.ok(result.listing.endTime.includes("2026-10-15"));
  });

  it("parses closed listing as ended", () => {
    const html = readFileSync(path.join(fixtures, "yahoo-ended.html"), "utf8");
    const result = parseYahooHtml(html, "https://auctions.yahoo.co.jp/jp/auction/j1247725357");
    assert.equal(result.status, "ended");
    if (result.status !== "ended") return;
    assert.equal(result.listing.id, "j1247725357");
    assert.equal(result.listing.availability, "ended");
    assert.equal(result.listing.priceYen, 7500);
  });

  it("falls back to OGP when NEXT_DATA is missing", () => {
    const html = readFileSync(path.join(fixtures, "yahoo-og-only.html"), "utf8");
    const result = parseYahooHtml(html, "https://auctions.yahoo.co.jp/jp/auction/w1000000001");
    assert.equal(result.status, "ok");
    if (result.status !== "ok") return;
    assert.equal(result.listing.id, "w1000000001");
    assert.equal(result.listing.title, "テスト出品タイトル");
    assert.equal(result.listing.photos[0]?.url.includes("example.jpg"), true);
  });

  it("returns error for empty html", () => {
    const result = parseYahooHtml("", "https://auctions.yahoo.co.jp/jp/auction/h1248094934");
    assert.equal(result.status, "error");
  });

  it("keeps the full long description (descriptionHtml over truncated description)", () => {
    const html = readFileSync(path.join(fixtures, "yahoo-long-description.html"), "utf8");
    const result = parseYahooHtml(html, "https://auctions.yahoo.co.jp/jp/auction/b1243771302");
    assert.notEqual(result.status, "error");
    if (result.status === "error") return;
    const d = result.listing.description;
    assert.ok(d.length > 4000, `length ${d.length}`);
    assert.ok(d.endsWith("最後の行です。"));
    assert.ok(!d.includes("..."));
    assert.ok(d.includes("行1：") && d.includes("行120："));
    assert.ok(d.split("\n").length > 100);
  });
});
