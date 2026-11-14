import { clerkEnabled } from "@/lib/account";
import { currentUser } from "@/lib/current-user";
import { clearSessionCookie } from "@/lib/session";
import { isRegisteredHost, yahooLoginConfig } from "@/lib/yahoo-oauth";

export async function GET(request: Request) {
  const user = await currentUser(request);
  return Response.json({
    email: user?.email || null,
    folder: user?.folder || null,
    clerkActive: clerkEnabled(),
    // Yahoo! JAPAN ID ログインは、Client ID / Secret を設定した本番URLでだけ出す
    yahooLogin: Boolean(yahooLoginConfig()) && isRegisteredHost(request),
  });
}

export async function DELETE() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
