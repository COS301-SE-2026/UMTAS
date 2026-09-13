"use client";

import { usePathname } from "next/navigation";
import { NavLink } from "@/components/atoms/nav/NavLink";
import { UserDetails } from "@/lib/userclass/userClass";
import { useEffect, useState } from "react";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/atoms/baseShadcn/menubar";

const noUniLinks = [
  { href: "/dashboard", label: "Home" },
  { href: "/builder", label: "Event Builder" },
  { href: "/schedules", label: "My Schedules" },
];

const basicLinks = [
  { href: "/module-management", label: "Manage Modules / Events" },
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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleChange = () => setRefreshKey((key) => key + 1);
    window.addEventListener(UserDetails.changeEvent, handleChange);
    return () =>
      window.removeEventListener(UserDetails.changeEvent, handleChange);
  }, []);

  const isAdmin = UserDetails.getUniDetails()?.role === "UNIVERSITY_ADMIN";

  const navItems = [...noUniLinks];

  const uniDetails = isMounted ? UserDetails.getUniDetails() : null;
  if (isMounted) {
    if (uniDetails?.UniversityName == "University of Pretoria")
      navItems.push(...universitySpecific);
    if (uniDetails != undefined) {
      navItems.push(...basicLinks);
    }

    if (isAdmin) {
      navItems.push(...extraAdminLinks);
    }
  }
  const isActive = (href: string) => pathName === href;
  const isGroupActive = (items: { href: string }[]) =>
    items.some((item) => pathName === item.href);

  //my little helper gives this solution for the hydration issues
  if (!isMounted) {
    return <nav aria-label="Main navigation" />;
  }

  const otherItems = navItems.filter((item) => !noUniLinks.includes(item));

  const manageItems = otherItems.filter(
    (item) => !extraAdminLinks.includes(item),
  );

  return (
    <nav aria-label="Main navigation">
      <Menubar className="border-none bg-transparent p-0 gap-6 h-auto">
        {noUniLinks.map(({ href, label }) => (
          <MenubarMenu key={href}>
            <MenubarTrigger
              onClick={() => (window.location.href = href)}
              className={`cursor-pointer text-sm font-medium border-b-2 rounded-none px-1 py-1.5 bg-transparent data-[state=open]:bg-transparent focus:bg-transparent ${
                isActive(href)
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              {label}
            </MenubarTrigger>
          </MenubarMenu>
        ))}

        {manageItems.length > 0 && (
          <MenubarMenu>
            <MenubarTrigger
              className={`cursor-pointer text-sm font-medium border-b-2 rounded-none px-1 py-1.5 bg-transparent data-[state=open]:bg-transparent focus:bg-transparent ${
                isGroupActive(manageItems)
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              Actions
            </MenubarTrigger>
            <MenubarContent
              align="start"
              className="bg-[var(--bg-surface)] border-[var(--border)]"
            >
              {manageItems.map(({ href, label }) => (
                <MenubarItem
                  key={href}
                  onClick={() => (window.location.href = href)}
                  className={`cursor-pointer ${
                    isActive(href)
                      ? "font-medium text-[var(--text-primary)]"
                      : ""
                  }`}
                >
                  {label}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        )}

        {isAdmin && (
          <MenubarMenu>
            <MenubarTrigger
              className={`cursor-pointer text-sm font-medium border-b-2 rounded-none px-1 py-1.5 bg-transparent data-[state=open]:bg-transparent focus:bg-transparent ${
                isGroupActive(extraAdminLinks)
                  ? "border-[var(--text-primary)] text-[var(--text-primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              Admin
            </MenubarTrigger>
            <MenubarContent
              align="start"
              className="bg-[var(--bg-surface)] border-[var(--border)]"
            >
              {extraAdminLinks.map(({ href, label }) => (
                <MenubarItem
                  key={href}
                  onClick={() => (window.location.href = href)}
                  className={`cursor-pointer ${
                    isActive(href)
                      ? "font-medium text-[var(--text-primary)]"
                      : ""
                  }`}
                >
                  {label}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        )}
      </Menubar>
    </nav>
  );
}
