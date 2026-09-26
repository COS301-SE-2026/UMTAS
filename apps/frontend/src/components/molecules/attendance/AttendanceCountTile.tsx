export function AttendanceCountTile({
  total,
  capacity,
  updatedAt,
  loading = false,
}: {
  total: number;
  capacity?: number;
  updatedAt?: string;
  loading?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--border)] pt-3">
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">
          Attendance
        </p>
        <p className="mt-1 text-xs text-[var(--text-secondary)]">
          {updatedAt
            ? `Updated ${new Date(updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
            : "Waiting for an update"}
        </p>
      </div>
      {loading ? (
        <div className="h-7 w-16 animate-pulse rounded bg-[var(--bg-elevated)]" />
      ) : (
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          {total}
          {capacity !== undefined && (
            <span className="text-sm font-normal text-[var(--text-secondary)]">
              {" "}
              / {capacity}
            </span>
          )}
        </p>
      )}
    </div>
  );
}
