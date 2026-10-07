import Link from "next/link";
import { LimitedUseNotice } from "@/components/molecules/legal/LimitedUseNotice";

const LINK_CLASSES =
  "rounded-sm underline underline-offset-2 hover:text-[var(--text-secondary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]";

export function GoogleAccessExplainer() {
  return (
    <section aria-labelledby="google-access-title" className="space-y-4">
      <h2
        id="google-access-title"
        className="text-[18px] font-semibold leading-[1.4] text-[var(--text-primary)]"
      >
        How UMTAS uses your Google account
      </h2>
      <ol className="list-decimal space-y-2 pl-6 text-[14px] leading-[1.6] text-[var(--text-primary)] marker:text-[var(--text-secondary)]">
        <li>
          Sign in with Google uses your name, email and profile picture to
          create your account.
        </li>
        <li>
          Only when you choose “Export to Google Calendar”, UMTAS asks for extra
          permission to create a UMTAS calendar and add your class sessions to
          it.
        </li>
        <li>
          You can disconnect at any time from{" "}
          <Link href="/account" className={LINK_CLASSES}>
            Account settings
          </Link>{" "}
          or from your{" "}
          <a
            href="https://myaccount.google.com/permissions"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASSES}
          >
            Google Account
          </a>
          .
        </li>
      </ol>
      <LimitedUseNotice />
      <p className="text-[14px] leading-[1.6] text-[var(--text-primary)]">
        Read the full{" "}
        <Link href="/privacy#google-user-data" className={LINK_CLASSES}>
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link href="/terms" className={LINK_CLASSES}>
          Terms of Service
        </Link>
        .
      </p>
    </section>
  );
}
