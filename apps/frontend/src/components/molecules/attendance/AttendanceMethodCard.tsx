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
      className="h-auto min-h-20 w-full justify-start gap-3 rounded-xl border-[var(--border)] bg-[var(--bg-base)] p-4 text-left whitespace-normal transition duration-[var(--duration-fast)] hover:-translate-y-px hover:border-[var(--text-disabled)] hover:bg-[var(--bg-elevated)]/50 motion-reduce:transform-none"
    >
      <Link href={href}>
        <AttendanceMethodIcon icon={icon} />
        <span className="min-w-0 flex-1">
          <span className="block font-medium text-[var(--text-primary)]">
            {title}
          </span>
          {description && (
            <span className="mt-0.5 block text-xs font-normal text-[var(--text-secondary)]">
              {description}
            </span>
          )}
        </span>
        <ChevronRight
          size={16}
          className="text-[var(--text-secondary)]"
          aria-hidden="true"
        />
      </Link>
    </Button>
  );
}
