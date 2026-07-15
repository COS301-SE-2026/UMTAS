"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/atoms/nav/NavLink";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home" },
  { href: "/builder", label: "Event Builder" },
  { href: "/schedules", label: "My Schedules" },
  { href: "/choose-institute", label: "Choose Institute" },
  { href: "/course-management", label: "Manage courses" },
  { href: "/role-management", label: "Manage roles" },
] as const;

export function NavLinks() {
  const pathName = usePathname();
  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6 list-none m-0 p-0">
        {NAV_ITEMS.map(({ href, label }) => {
          const isActive = pathName === href;
          return (
            <li
              key={href}
              className={`h-full flex items-center border-b-2 transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
              }`}
            >
              <NavLink href={href}>{label}</NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
