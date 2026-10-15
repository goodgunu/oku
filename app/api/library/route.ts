import { listRecords } from "@/lib/store";

export async function GET() {
  const listings = await listRecords();
  return Response.json({ listings });
}
