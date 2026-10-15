import assert from "node:assert/strict";
import { test } from "node:test";
import { classify, countByFilter } from "../lib/classify";

const now = Date.parse("2026-10-15T12:00:00+09:00");
test("classify", () => {
  assert.equal(classify({ availability: "live", endTime: "2026-10-16T00:00:00+09:00" }, now), "live");
  assert.equal(classify({ availability: "live", endTime: "2026-10-15T11:00:00+09:00" }, now), "ended");
  assert.equal(classify({ availability: "ended", endTime: "2026-12-01T00:00:00+09:00" }, now), "ended");
  assert.equal(classify({ availability: "unknown", endTime: "" }, now), "live");
  assert.equal(classify({ availability: "live", endTime: "garbage" }, now), "live");
});
test("counts", () => {
  const c = countByFilter([
    { availability: "live", endTime: "" },
    { availability: "ended", endTime: "" },
    { availability: "live", endTime: "2020-01-01T00:00:00+09:00" },
  ], now);
  assert.deepEqual(c, { all: 3, live: 1, ended: 2 });
});
