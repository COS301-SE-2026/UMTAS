import Link from "next/link";

const LINK_CLASSES =
  "rounded-sm text-[12px] leading-[1.5] text-[var(--text-secondary)] underline-offset-2 transition-colors duration-[var(--duration-fast)] ease-[var(--easing-default)] hover:text-[var(--text-primary)] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-6 py-6 md:flex-row md:items-center md:justify-between md:px-8">
        <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <li>
            <Link href="/privacy" className={LINK_CLASSES}>
              Privacy Policy
            </Link>
          </li>
          <li>
            <Link href="/terms" className={LINK_CLASSES}>
              Terms of Service
            </Link>
          </li>
          <li>
            <Link href="/faq" className={LINK_CLASSES}>
              Help Centre
            </Link>
          </li>
          <li>
            <a href="mailto:vigil.cs2025@gmail.com" className={LINK_CLASSES}>
              Contact
            </a>
          </li>
        </ul>
        <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)]">
          © {year} Team Vigil of the University of Pretoria · University Modular
          Timetable & Analytics System
        </p>
      </div>
    </footer>
  );
}
