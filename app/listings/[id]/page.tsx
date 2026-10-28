import { notFound } from "next/navigation";
import { ListingDetail } from "@/components/listing-detail";
import { LoginGate } from "@/components/login-gate";
import { identity } from "@/lib/current-user";
import { getRecord } from "@/lib/store";
import { isListingId } from "@/lib/sources";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function ListingPage({ params }: Props) {
  const { id } = await params;
  if (!isListingId(id)) notFound();
  const who = await identity();
  if (who.state !== "ok") return <LoginGate state={who.state} />;
  const user = who.user;
  const listing = await getRecord(user.folder, id);
  if (!listing) notFound();

  return <ListingDetail initialListing={listing} />;
}
