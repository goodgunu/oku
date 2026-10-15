import assert from "node:assert/strict";
import { test } from "node:test";
import { NEEDS_GOOGLE_MESSAGE, resolveEmail } from "../lib/identity";

test("primary email wins and skips lookup", async () => {
  let called = false;
  const r = await resolveEmail("A@Example.com", ["U1234567"], async () => { called = true; return "x@y.com"; });
  assert.deepEqual(r, { email: "a@example.com", source: "primary" });
  assert.equal(called, false);
});

test("no email falls back to LINE link mapping", async () => {
  const r = await resolveEmail(null, ["U1234567"], async (id) => (id === "U1234567" ? "g@example.com" : null));
  assert.deepEqual(r, { email: "g@example.com", source: "line-link" });
});

test("no email and no mapping resolves to null", async () => {
  assert.equal(await resolveEmail("", ["U1234567"], async () => null), null);
  assert.equal(await resolveEmail(undefined, [], async () => "z@z.com"), null);
  assert.equal(await resolveEmail(null, ["U1"], async () => { throw new Error("x"); }), null);
});

test("message text", () => {
  assert.equal(NEEDS_GOOGLE_MESSAGE, "LINEにメールがないため、先にGoogleでログインしてください");
});
