import { ShieldCheck } from "lucide-react";

export function LimitedUseNotice() {
  return (
    <aside
      aria-label="Google API Services User Data Policy"
      className="flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-low)]"
    >
      <ShieldCheck
        size={16}
        strokeWidth={1.5}
        className="mt-1 shrink-0 text-[var(--text-primary)]"
        aria-hidden="true"
      />
      <p className="text-[14px] leading-[1.6] text-[var(--text-primary)]">
        UMTAS&apos;s use and transfer to any other app of information received
        from Google APIs will adhere to the{" "}
        <a
          href="https://developers.google.com/terms/api-services-user-data-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2"
        >
          Google API Services User Data Policy
        </a>
        , including the Limited Use requirements.
      </p>
    </aside>
  );
}
