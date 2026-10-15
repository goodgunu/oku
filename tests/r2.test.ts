import assert from "node:assert/strict";
import { test } from "node:test";
import { extFromContentType, photoKey, recordKey } from "@/lib/r2";

test("R2 key naming", () => {
  assert.equal(recordKey("H1248094934"), "records/me/h1248094934.json");
  assert.equal(photoKey("h1248094934", 3, "jpg"), "photos/h1248094934/3.jpg");
  assert.equal(extFromContentType("image/jpeg; charset=x"), "jpg");
  assert.equal(extFromContentType("text/html"), null);
});
