export function SpecChip({
  label,
  value,
  tone = "plain",
}: {
  label: string;
  value: string;
  tone?: "plain" | "warn" | "calm";
}) {
  const toneClass =
    tone === "warn"
      ? "border-red-300 bg-red-50 text-red-700 font-bold"
      : tone === "calm"
        ? "border-border bg-background text-muted font-medium"
        : "border-border bg-card text-ink font-bold";
  return (
    <span className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-1 text-xs ${toneClass}`}>
      <span className="text-[10px] font-medium opacity-70">{label}</span>
      <span className="truncate text-sm">{value || "—"}</span>
    </span>
  );
}
