import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { NavLinks } from "@/components/molecules/nav/NavLinks";
import { NavUser } from "@/components/molecules/nav/NavUser";

interface TopNavBarProps {
  userName?: string | null;
}

/**
 * Layout:
 *   [Logo]   [Nav links]   ...spasie...   [ThemeToggle] [Avatar] [Sign out]
 */
export function TopNavBar({ userName }: TopNavBarProps) {
  return (
    <header
      className="sticky top-0 z-40 w-full bg-[var(--bg-surface)] border-b border-[var(--border)]"
      role="banner"
    >
      <div className="mx-auto flex h-14 items-center gap-6 px-4 sm:px-6">
        {/* Left: Logo */}
        <UmtasLogo />

        {/* Centre: Nav links, hidden on mobile, shown from sm breakpoint */}
        <div className="hidden sm:flex flex-1 items-center">
          <NavLinks />
        </div>

        {/* Spacer on mobile to push user section right */}
        <div className="flex-1 sm:hidden" aria-hidden />

        {/* Right: User controls */}
        <NavUser name={userName} />
      </div>

      {/* Mobile nav, shown below header on small screens */}
      <div className="sm:hidden border-t border-[--border] px-4 py-2 bg-[--bg-surface]">
        <NavLinks />
      </div>
    </header>
  );
}
