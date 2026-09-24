export function AttendanceDateStamp({ date }: { date: Date }) {
  const weekday = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
  }).format(date);
  const fullDate = new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return (
    <p className="text-left text-xs text-[var(--text-secondary)] sm:text-right">
      <span className="block text-sm font-medium text-[var(--text-primary)]">
        {weekday}
      </span>
      {fullDate}
    </p>
  );
}
