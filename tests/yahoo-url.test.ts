import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canonicalYahooUrl, extractYahooUrl, isYahooListingId } from "../lib/yahoo-url";

describe("canonicalYahooUrl", () => {
  it("normalizes auctions.yahoo.co.jp URLs", () => {
    const result = canonicalYahooUrl("https://auctions.yahoo.co.jp/jp/auction/h1248094934?foo=1");
    assert.deepEqual(result, {
      id: "h1248094934",
      url: "https://auctions.yahoo.co.jp/jp/auction/h1248094934",
    });
  });

  it("accepts page.auctions.yahoo.co.jp", () => {
    const result = canonicalYahooUrl("https://page.auctions.yahoo.co.jp/jp/auction/w1000123456");
    assert.equal(result?.id, "w1000123456");
  });

  it("rejects non-yahoo hosts even with an auction-looking id", () => {
    assert.equal(canonicalYahooUrl("https://example.com/jp/auction/h1248094934"), null);
  });

  it("accepts bare id text", () => {
    assert.equal(canonicalYahooUrl("h1248094934")?.url, "https://auctions.yahoo.co.jp/jp/auction/h1248094934");
  });

  it("returns null for empty", () => {
    assert.equal(canonicalYahooUrl(""), null);
  });
});

describe("extractYahooUrl", () => {
  it("finds URL inside LINE-like message text", () => {
    const text = "これ見て\nhttps://auctions.yahoo.co.jp/jp/auction/u1228245051\nお願いします";
    assert.equal(extractYahooUrl(text)?.id, "u1228245051");
  });
});

describe("variants", () => {
  const b = "https://auctions.yahoo.co.jp/jp/auction/b1243771302";
  it("accepts b-prefix", () => {
    assert.equal(canonicalYahooUrl(b)?.id, "b1243771302");
    assert.equal(isYahooListingId("b1243771302"), true);
  });
  it("accepts digits-only ids and other letters", () => {
    assert.equal(isYahooListingId("1243771302"), true);
    assert.equal(canonicalYahooUrl("https://auctions.yahoo.co.jp/jp/auction/1243771302")?.id, "1243771302");
    for (const c of "cdefgklmnpqrstuvwx") assert.equal(isYahooListingId(`${c}123456789`), true);
  });
  it("mixed share text with Japanese around the URL", () => {
    const t = `【新品】バッテリー 95D26L 現在価格 9,337円${b}?u=1 をヤフオクで見つけたよ！`;
    assert.equal(extractYahooUrl(t)?.id, "b1243771302");
    assert.equal(extractYahooUrl(`Hello\n${b}\nよろしく`)?.url, b);
  });
  it("other URL forms", () => {
    assert.equal(canonicalYahooUrl("https://page.auctions.yahoo.co.jp/jp/auction/B1243771302")?.id, "b1243771302");
    assert.equal(canonicalYahooUrl("https://auctions.yahoo.co.jp/auction/b1243771302")?.id, "b1243771302");
    assert.equal(canonicalYahooUrl("https://page.auctions.yahoo.co.jp/jp/show/auction?aID=b1243771302")?.id, "b1243771302");
    assert.equal(canonicalYahooUrl("auctions.yahoo.co.jp/jp/auction/b1243771302")?.id, "b1243771302");
  });
  it("ignores other hosts", () => {
    assert.equal(canonicalYahooUrl("https://example.com/auction/b1243771302"), null);
  });
});

describe("isYahooListingId", () => {
  it("validates id shape", () => {
    assert.equal(isYahooListingId("h1248094934"), true);
    assert.equal(isYahooListingId("AU123"), false);
  });
});
