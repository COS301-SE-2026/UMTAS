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
      <div className="mx-auto flex h-14 items-center gap-4 px-4 md:px-6">
        <div className="shrink-0">
          <UmtasLogo />
        </div>
        <div className="hidden md:flex flex-1 items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-none]">
          <NavLinks />
        </div>
        <div className="flex-1 md:hidden" aria-hidden />
        <div className="shrink-0">
          <NavUser name={userName} />
        </div>
      </div>
      {/* mobile nav */}
      <div className="md:hidden border-t border-[var(--border)] px-4 py-2 bg-[var(--bg-surface)] overflow-x-auto whitespace-nowrap [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <NavLinks />
      </div>
    </header>
  );
}
