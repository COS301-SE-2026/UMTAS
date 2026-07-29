"use client";

import { useEffect, useState } from "react";
import { UmtasLogo } from "@/components/atoms/auth/UmtasLogo";
import { NavLinks } from "@/components/molecules/nav/NavLinks";
import { NavUser } from "@/components/molecules/nav/NavUser";
import { UserDetails } from "@/lib/userclass/userClass";
import Tutorial from "@/components/organisms/nav/Tutorial";

interface TopNavBarProps {
  userName?: string | null;
}

/**
 * Layout:
 *   [Logo]   [Nav links]   ...spasie...   [ThemeToggle] [Avatar] [Sign out]
 */
export function TopNavBar({ userName }: TopNavBarProps) {
  const [needsInstitute, setNeedsInstitute] = useState(false);

  useEffect(() => {
    const UniDetails = UserDetails.getUniDetails();
    if (UniDetails === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNeedsInstitute(true);
    }
  }, []);

  const steps = [
    {
      target: "#nav-user-avatar",
      content:
        "Choose an institute where you will be forced to choose an institute if you have not already.",
    },
  ];

  return (
    <header
      className="sticky top-0 z-40 w-full bg-[var(--bg-surface)] border-b border-[var(--border)]"
      role="banner"
    >
      {needsInstitute && <Tutorial steps={steps} wait={false} />}
      <div className="mx-auto flex h-14 items-center gap-4 px-4 md:px-6">
        <div className="shrink-0">
          <UmtasLogo />
        </div>
        <div className="hidden md:flex flex-1 items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-none]">
          <NavLinks />
        </div>
        <div className="flex-1 md:hidden" aria-hidden />
        <div id="nav-user-avatar" className="shrink-0">
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
