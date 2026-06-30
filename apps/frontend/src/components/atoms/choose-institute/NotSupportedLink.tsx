"use client";

interface NotSupportedLinkProps {
  onClick: () => void;
}

export function NotSupportedLink({ onClick }: NotSupportedLinkProps) {
  <button
    type="button"
    onClick={onClick}
    className="text-xs text-[var(--text-secondary)] underline-offset-2 hover:underline"
  >
    University not supported?
  </button>;
}
