"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/atoms/nav/NavLink";
import { UserDetails } from "@/lib/userclass/userClass";
import { useEffect, useState } from "react";

const noUniLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/builder", label: "Event Builder" },
  { href: "/schedules", label: "My Schedules" },
];

const basicLinks = [
  { href: "/module-management", label: "Manage Modules & Events" },
  { href: "/map", label: "Map" },
];

const extraAdminLinks = [
  { href: "/course-management", label: "Manage Courses" },
  { href: "/role-management", label: "Manage Roles" },
  { href: "/calendar-management", label: "Manage Calendars" },
  { href: "/stats", label: "Stats" },
];
const universitySpecific = [{ href: "/solver", label: "Upload PDF" }];

export function NavLinks() {
  const pathName = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  const isAdmin = UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN";

  const navItems = [...noUniLinks];

  const uniDetails = isMounted ? UserDetails.getUniDetails() : null;
  if (isMounted) {
    if (uniDetails != undefined) {
      navItems.push(...basicLinks);
    }
    if (uniDetails?.UniversityName == "University of Pretoria")
      navItems.push(...universitySpecific);

    if (isAdmin) {
      navItems.push(...extraAdminLinks);
    }
  }
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
