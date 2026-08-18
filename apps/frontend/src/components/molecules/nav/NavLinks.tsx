"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/atoms/nav/NavLink";
import { UserDetails } from "@/lib/userclass/userClass";
import { useEffect, useState } from "react";

const basicLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/solver", label: "Upload PDF" },
  { href: "/builder", label: "Event Builder" },
  { href: "/schedules", label: "My Schedules" },
  { href: "/module-management", label: "Manage Modules & Events" },
  { href: "/map", label: "Map" },
];

const extraAdminLinks = [
  { href: "/course-management", label: "Manage Courses" },
  { href: "/role-management", label: "Manage Roles" },
];

export function NavLinks() {
  const pathName = usePathname();
  const [vlaggie, setVlaggie] = useState(false);

  //timer is to silence linting's screams...
  useEffect(() => {
    const timer = setTimeout(() => {
      setVlaggie(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const isAdmin = vlaggie
    ? UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN"
    : false;

  const navItems = isAdmin ? [...basicLinks, ...extraAdminLinks] : basicLinks;

  return (
    <nav aria-label="Main navigation">
      <ul className="flex items-center gap-6 list-none m-0 p-0">
        {navItems.map(({ href, label }) => {
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
