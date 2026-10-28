import { currentUser, unauthorized } from "@/lib/current-user";
import { isLineLinkedEmail } from "@/lib/line-link";
import { lineLoginConfig } from "@/lib/line-oauth";

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return unauthorized();
  const line = user.via === "line" ? true : await isLineLinkedEmail(user.email);
  return Response.json({
    line,
    canLinkLine: Boolean(lineLoginConfig()),
  });
}
