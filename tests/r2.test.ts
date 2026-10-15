import assert from "node:assert/strict";
import { test } from "node:test";
import { extFromContentType, photoKey, recordKey } from "@/lib/r2";

test("R2 key naming is per user folder", () => {
  assert.equal(recordKey("me", "H1248094934"), "records/me/h1248094934.json");
  assert.equal(recordKey("abc123", "H1248094934"), "records/abc123/h1248094934.json");
  assert.equal(photoKey("abc123", "h1248094934", 3, "jpg"), "photos/abc123/h1248094934/3.jpg");
  assert.equal(extFromContentType("image/jpeg; charset=x"), "jpg");
  assert.equal(extFromContentType("text/html"), null);
});
