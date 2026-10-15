import { ArchiveForm } from "@/components/archive-form";
import { LibraryList } from "@/components/library-list";
import { LoginGate } from "@/components/login-gate";
import { LineAddCard } from "@/components/line-add-card";
import { identity } from "@/lib/current-user";
import { listRecords } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const id = await identity();
  if (id.state !== "ok") return <LoginGate state={id.state} withLineCard />;
  const user = id.user;
  const listings = await listRecords(user.folder);

  return (
    <div className="space-y-6">
      <ArchiveForm />
      <section className="space-y-3">
        <div className="flex items-baseline justify-between border-b-2 border-yahoo pb-2">
          <h2 className="text-lg font-bold text-ink">ライブラリ</h2>
          <span className="text-xs font-medium text-muted">{listings.length}件</span>
        </div>
        <LibraryList listings={listings} />
      </section>
      <LineAddCard />
    </div>
  );
}
