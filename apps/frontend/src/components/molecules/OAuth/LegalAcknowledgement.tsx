import Link from "next/link";

const LINK_CLASSES =
  "rounded-sm underline underline-offset-2 hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]";

export function LegalAcknowledgement() {
  return (
    <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)] text-center">
      By continuing, you agree to the{" "}
      <Link href="/terms" className={LINK_CLASSES}>
        Terms of Service
      </Link>{" "}
      and acknowledge the{" "}
      <Link href="/privacy" className={LINK_CLASSES}>
        Privacy Policy
      </Link>
      .
    </p>
  );
}
