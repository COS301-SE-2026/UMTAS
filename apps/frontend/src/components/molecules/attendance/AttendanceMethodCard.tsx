import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { AttendanceMethodIcon } from "@/components/atoms/attendance/AttendanceMethodIcon";
import { Button } from "@/components/atoms/baseShadcn/button";

export function AttendanceMethodCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: LucideIcon;
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <Button
      asChild
      variant="outline"
      className="h-auto min-h-24 w-full justify-start gap-4 rounded-lg border-[var(--border)] bg-[var(--bg-surface)] p-4 text-left whitespace-normal transition-colors duration-[var(--duration-fast)] hover:bg-[var(--bg-elevated)]"
    >
      <Link href={href}>
        <AttendanceMethodIcon icon={icon} />

        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-[var(--text-primary)]">
            {title}
          </span>

          {description && (
            <span className="mt-1 block text-xs font-normal leading-5 text-[var(--text-secondary)]">
              {description}
            </span>
          )}
        </span>

        <ChevronRight
          size={16}
          className="shrink-0 text-[var(--text-secondary)]"
          aria-hidden="true"
        />
      </Link>
    </Button>
  );
}
