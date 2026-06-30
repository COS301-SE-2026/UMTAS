"use client";
import Link from "next/link";
interface NotSupportedLinkProps {
  onClick: () => void;
}

export function NotSupportedLink({ onClick }: NotSupportedLinkProps) {
  return (
    <Link
      href="/builder/"
      onClick={onClick}
      className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
    >
      University not supported?
    </Link>
  );
}
