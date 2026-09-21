export function AttendancePageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--text-secondary)]">
          {description}
        </p>
      </div>
      {action && (
        <div className="shrink-0 text-xs text-[var(--text-secondary)]">
          {action}
        </div>
      )}
    </div>
  );
}
