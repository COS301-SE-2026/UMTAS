import type { LucideIcon } from "lucide-react";

export function AttendanceMethodIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
    </span>
  );
}
