"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/../utilities/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

export function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "relative text-sm font-medium transition-colors duration-150",
        "px-1 py-0.5",
        "after:absolute after:bottom-0 after:left-0 after:h-px after:w-full",
        "after:origin-left after:scale-x-0 after:transition-transform after:duration-200",
        "hover:after:scale-x-100",
        isActive
          ? "text-[--text-primary] after:bg-[--text-primary] after:scale-x-100"
          : "text-[--text-secondary] hover:text-[--text-primary] after:bg-[--text-primary]",
      )}
    >
      {children}
    </Link>
  );
}
