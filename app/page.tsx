import { LibraryList } from "@/components/library-list";
import { LineAddCard } from "@/components/line-add-card";
import { LoginGate } from "@/components/login-gate";
import { NotifySettingCard } from "@/components/notify-setting";
import { identity } from "@/lib/current-user";
import { listRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const id = await identity();
  if (id.state !== "ok") return <LoginGate state={id.state} withLineCard />;
  const user = id.user;
  const listings = await listRecords(user.folder);

  return (
    <div className="space-y-6 pb-16">
      <section className="space-y-3">
        <LibraryList listings={listings} />
      </section>
      <NotifySettingCard />
      <div id="line-add-card" className="scroll-mt-4">
        <LineAddCard />
      </div>
    </div>
  );
}
