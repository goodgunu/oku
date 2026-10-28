import { currentUser } from "@/lib/current-user";
import { clearSessionCookie } from "@/lib/session";

export async function GET(request: Request) {
  const user = await currentUser(request);
  return Response.json({ email: user?.email || null, folder: user?.folder || null });
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
