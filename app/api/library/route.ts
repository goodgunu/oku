import { currentUser, unauthorized } from "@/lib/current-user";
import { listRecords } from "@/lib/store";

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const listings = await listRecords(user.folder);
  return Response.json({ listings });
}
