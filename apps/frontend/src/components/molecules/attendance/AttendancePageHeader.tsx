import { cn } from "@/../utilities/utils";

export function AttendancePageHeader({
  title,
  description,
  action,
  meta,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
            {description}
          </p>
        )}
      </div>
      {(meta || action) && (
        <div className="flex shrink-0 flex-col items-start gap-2 text-xs text-[var(--text-secondary)] sm:items-end">
          {meta}
          {action}
        </div>
      )}
    </div>
  );
}
