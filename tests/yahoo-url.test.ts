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

describe("isYahooListingId", () => {
  it("validates id shape", () => {
    assert.equal(isYahooListingId("h1248094934"), true);
    assert.equal(isYahooListingId("AU123"), false);
  });
});
