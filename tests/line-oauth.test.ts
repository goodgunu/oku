import assert from "node:assert/strict";
import { test } from "node:test";
import { readLinePending, startLineLogin } from "../lib/line-oauth";

const SECRET = "test-secret-for-line-oauth";
const CHANNEL = "1234567890";
const REDIRECT = "https://oku-bice.vercel.app/api/auth/line-login/callback";

function authorizeState(location: string): string {
  return new URL(location).searchParams.get("state") || "";
}

test("同じ行き先のLINEログイン開始を重ねても、state クッキーを上書きしない", () => {
  const first = startLineLogin(SECRET, CHANNEL, REDIRECT, "/");
  const second = startLineLogin(SECRET, CHANNEL, REDIRECT, "/", undefined, first.cookieValue);
  assert.equal(second.cookieValue, first.cookieValue);
  assert.equal(authorizeState(second.location), authorizeState(first.location));
  const pending = readLinePending(second.cookieValue, SECRET);
  assert.equal(pending?.state, authorizeState(first.location));
  assert.equal(pending?.next, "/");
});

test("行き先や連携先が違うときは、新しい state を発行する", () => {
  const first = startLineLogin(SECRET, CHANNEL, REDIRECT, "/");
  const otherNext = startLineLogin(SECRET, CHANNEL, REDIRECT, "/compare", undefined, first.cookieValue);
  assert.notEqual(otherNext.cookieValue, first.cookieValue);
  assert.notEqual(authorizeState(otherNext.location), authorizeState(first.location));

  const link = startLineLogin(SECRET, CHANNEL, REDIRECT, "/", "user@example.com", first.cookieValue);
  assert.notEqual(link.cookieValue, first.cookieValue);
  assert.equal(readLinePending(link.cookieValue, SECRET)?.link, "user@example.com");
});

test("壊れたクッキーや期限切れは使い回さない", () => {
  const fresh = startLineLogin(SECRET, CHANNEL, REDIRECT, "/", undefined, "broken");
  assert.match(authorizeState(fresh.location), /^[a-f0-9]{32}$/);

  const first = startLineLogin(SECRET, CHANNEL, REDIRECT, "/");
  const expired = `${Buffer.from(
    JSON.stringify({
      state: "dead",
      nonce: "dead",
      next: "/",
      exp: Date.now() - 1000,
    }),
  ).toString("base64url")}.${"x".repeat(40)}`;
  // signature will not match, so treat as missing
  const again = startLineLogin(SECRET, CHANNEL, REDIRECT, "/", undefined, expired);
  assert.notEqual(authorizeState(again.location), "dead");
  void first;
});
