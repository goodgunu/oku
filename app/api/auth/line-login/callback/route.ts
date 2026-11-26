import { isLineConflict, linkLineUser, linkedEmail } from "@/lib/line-link";
import { safeNext } from "@/lib/line-login";
import {
  LINE_STATE_COOKIE,
  exchangeLineCode,
  lineAccountId,
  lineCallbackUri,
  lineLoginConfig,
  readLinePending,
} from "@/lib/line-oauth";
import { readCookie, sessionCookie, signSession } from "@/lib/session";
import { authSecret } from "@/lib/store";

const CLEAR_STATE = `${LINE_STATE_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;

function redirectWith(origin: string, nextPath: string, flag: string, extraCookies: string[] = []): Response {
  const dest = new URL(safeNext(nextPath), origin);
  dest.searchParams.set("line", flag);
  const headers = new Headers({ Location: dest.toString() });
  headers.append("Set-Cookie", CLEAR_STATE);
  for (const c of extraCookies) headers.append("Set-Cookie", c);
  return new Response(null, { status: 303, headers });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const config = lineLoginConfig();
  if (!config) {
    return redirectWith(url.origin, "/", "failed");
  }
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  const error = url.searchParams.get("error") || "";
  const pending = readLinePending(readCookie(request.headers.get("cookie"), LINE_STATE_COOKIE), await authSecret());
  if (!pending) {
    return redirectWith(url.origin, "/", "expired");
  }
  if (error === "access_denied") {
    return redirectWith(url.origin, pending.next, "denied");
  }
  if (!code || state !== pending.state) {
    console.warn("[line-login] callback rejected", {
      hasCode: Boolean(code),
      stateMatch: state === pending.state,
      error: error || undefined,
    });
    return redirectWith(url.origin, pending.next, "failed");
  }
  const redirectUri = lineCallbackUri(request);
  const profile = await exchangeLineCode(code, redirectUri, pending.nonce, config);
  if (!profile) {
    console.warn("[line-login] token exchange failed");
    return redirectWith(url.origin, pending.next, "failed");
  }

  if (pending.link) {
    const existing = await linkedEmail(profile.sub);
    if (isLineConflict(existing, pending.link, profile.sub)) {
      return redirectWith(url.origin, pending.next, "conflict");
    }
    await linkLineUser(profile.sub, pending.link);
    return redirectWith(url.origin, pending.next, "linked");
  }

  const selfAccount = lineAccountId(profile.sub);
  const linked = await linkedEmail(profile.sub);
  if (!linked) {
    await linkLineUser(profile.sub, selfAccount);
  }
  const account = linked && linked !== selfAccount ? `lineauth:${linked}` : selfAccount;
  const token = await signSession(account);
  const destination = new URL(safeNext(pending.next), url.origin);
  const headers = new Headers({ Location: destination.toString() });
  headers.append("Set-Cookie", CLEAR_STATE);
  headers.append("Set-Cookie", sessionCookie(token));
  return new Response(null, { status: 303, headers });
}
