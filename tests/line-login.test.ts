import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

test("LINE login links last 7 days and can be opened more than once", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "oku-line-login-"));
  process.env.OKU_DATA_DIR = dir;
  for (const k of ["R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_ACCOUNT_ID", "R2_BUCKET"]) delete process.env[k];
  const { LOGIN_TTL_MS, consumeLineLogin, issueLineLogin, safeNext } = await import("../lib/line-login");
  assert.equal(LOGIN_TTL_MS, 7 * 24 * 60 * 60 * 1000);
  assert.equal(safeNext("/listings/abc"), "/listings/abc");
  assert.equal(safeNext("https://evil.example"), "/");

  const now = Date.parse("2026-11-12T13:00:00Z");
  const code = await issueLineLogin("U1234567890abcdef", "/listings/abc", now);
  assert.match(code, /^[a-f0-9]{32}$/);

  const first = await consumeLineLogin(code, now + 60_000);
  assert.equal(first?.lineUserId, "U1234567890abcdef");
  assert.equal(first?.next, "/listings/abc");
  assert.equal(first?.exp, now + LOGIN_TTL_MS);

  const second = await consumeLineLogin(code, now + 2 * 24 * 60 * 60 * 1000);
  assert.equal(second?.lineUserId, "U1234567890abcdef");

  const expired = await consumeLineLogin(code, now + LOGIN_TTL_MS + 1);
  assert.equal(expired, null);
  assert.equal(await consumeLineLogin("nope", now), null);
  await rm(dir, { recursive: true, force: true });
});
