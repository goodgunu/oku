import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { createHash } from "node:crypto";
import { lineLinkKey, normalizeEmail, photoUrl, signPhoto, userFolder, verifyPhoto } from "../lib/account";
import { buildConnectMessage } from "../lib/line-message";

test("userFolder is sha256(lower email).slice(0,20)", () => {
  const expected = createHash("sha256").update("a@example.com").digest("hex").slice(0, 20);
  assert.equal(userFolder("A@Example.com"), expected);
  assert.equal(userFolder("A@Example.com").length, 20);
});

test("normalizeEmail", () => {
  assert.equal(normalizeEmail(" X@Y.com "), "x@y.com");
  assert.equal(normalizeEmail("nope"), "");
});

test("line link key is hashed", () => {
  const k = lineLinkKey("U1234567890abcdef");
  assert.match(k, /^links\/[a-f0-9]{40}\.json$/);
  assert.ok(!k.includes("U1234567890"));
});

test("photo signature verifies only for same folder/id/index", () => {
  process.env.AUTH_SECRET = "test-secret";
  const sig = signPhoto("abc", "H1", 0);
  assert.ok(sig);
  assert.ok(verifyPhoto("abc", "h1", 0, sig));
  assert.ok(!verifyPhoto("abd", "h1", 0, sig));
  assert.ok(!verifyPhoto("abc", "h1", 1, sig));
  assert.ok(!verifyPhoto("abc", "h1", 0, ""));
  assert.match(photoUrl("https://x", "abc", "h1", 0), /\/api\/photo\/h1\/0\?u=abc&t=[a-f0-9]{32}/);
  delete process.env.AUTH_SECRET;
});

test("connect message is yellow with link", () => {
  const [m] = buildConnectMessage("https://oku-bice.vercel.app/line/connect?code=abc");
  assert.equal(m.type, "flex");
  const json = JSON.stringify(m);
  assert.match(json, /#ffdc00/);
  assert.match(json, /line\/connect\?code=abc/);
});

test("store: per-user folders and legacy adoption (local fs)", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "oku-"));
  process.env.OKU_DATA_DIR = dir;
  for (const k of ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ACCOUNT_ID", "R2_BUCKET"]) delete process.env[k];
  const { adoptLegacyLibrary, getRecord, listRecords, putRecord } = await import("../lib/store");
  const rec = { id: "h1248094934", savedAt: "2026-01-01", photos: [] } as never;
  await putRecord("me", rec);
  await adoptLegacyLibrary(userFolder("first@example.com"));
  assert.equal((await listRecords("me")).length, 0);
  assert.equal((await listRecords(userFolder("first@example.com"))).length, 1);
  await adoptLegacyLibrary(userFolder("second@example.com"));
  assert.equal((await listRecords(userFolder("second@example.com"))).length, 0);
  assert.equal(await getRecord(userFolder("second@example.com"), "h1248094934"), null);
});
