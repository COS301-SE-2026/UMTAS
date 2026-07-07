export function IdentityTable() {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-bg-base shadow-sm transition-colors duration-[var(--duration-fast)]">
      <table className="w-full table-fixed text-left text-sm text-[var(--text-secondary)]">
        <thead className="bg-bg-surface text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)] border-b border-border">
          <tr>
            <th className="w-1/3 px-4 py-3">Situation</th>
            <th className="w-2/3 px-4 py-3">Tone</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          <tr className="brand-table-hover">
            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
              Onboarding / Empty States
            </td>
            <td className="px-4 py-3 text-[var(--text-secondary)]">
              Warm, encouraging, action-oriented
            </td>
          </tr>
          <tr className="brand-table-hover">
            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
              Informational labels / tooltips
            </td>
            <td className="px-4 py-3 text-[var(--text-secondary)]">
              Neutral, precise, no filler
            </td>
          </tr>
          <tr className="brand-table-hover">
            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
              Error messages
            </td>
            <td className="px-4 py-3 text-[var(--text-secondary)]">
              Honest, calm, tells the user what to do next
            </td>
          </tr>
          <tr className="brand-table-hover">
            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
              Success feedback
            </td>
            <td className="px-4 py-3 text-[var(--text-secondary)]">
              Brief, affirmative, not over-celebratory
            </td>
          </tr>
          <tr className="brand-table-hover">
            <td className="px-4 py-3 font-medium text-[var(--text-primary)]">
              Security / Destructive actions
            </td>
            <td className="px-4 py-3 text-[var(--text-secondary)]">
              Sober, direct, no softening language
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
