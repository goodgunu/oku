import test from "node:test";
import assert from "node:assert/strict";
import { externalBrowserUrl, isLineInApp } from "../lib/in-app-browser";

test("detects LINE UA", () => {
  assert.ok(isLineInApp("Mozilla/5.0 (iPhone) AppleWebKit Mobile Safari Line/13.1.0"));
  assert.ok(!isLineInApp("Mozilla/5.0 Chrome/120 Safari/537"));
});
test("external browser url", () => {
  assert.equal(externalBrowserUrl("https://a.test/c?x=1"), "https://a.test/c?x=1&openExternalBrowser=1");
});
