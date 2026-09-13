"use client";

import { useEffect, useState } from "react";

import { usePathname, useRouter } from "next/navigation";

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/atoms/baseShadcn/menubar";

import { UserDetails } from "@/lib/userclass/userClass";

import {
  executeNavigationAction,
  getVisibleNavigationItems,
  NavigationItem,
} from "@/types/Nav";

export function NavLinks() {
  const pathname = usePathname();
  const router = useRouter();

  const [, forceRefresh] = useState(0);

  useEffect(() => {
    const handleUserDetailsChange = () => {
      forceRefresh((value) => value + 1);
    };

    window.addEventListener(UserDetails.changeEvent, handleUserDetailsChange);

    return () => {
      window.removeEventListener(
        UserDetails.changeEvent,
        handleUserDetailsChange,
      );
    };
  }, []);

  const universityDetails = UserDetails.getUniDetails();

  const visibleItems = getVisibleNavigationItems({
    role: universityDetails?.role ?? undefined,
    universityName: universityDetails?.UniversityName,
  }).filter((item) => item.showInNavbar);

  const primaryItems = visibleItems.filter(
    (item) => item.section === "primary",
  );

  const actionItems = visibleItems.filter((item) => item.section === "actions");

  const adminItems = visibleItems.filter((item) => item.section === "admin");

  const helpItems = visibleItems.filter((item) => item.section === "help");

  const isActive = (href?: string) => {
    if (!href) {
      return false;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isGroupActive = (items: NavigationItem[]) => {
    return items.some((item) => isActive(item.href));
  };

  const handleItemClick = (item: NavigationItem) => {
    if (item.action) {
      executeNavigationAction(item.action);
      return;
    }

    if (item.href) {
      router.push(item.href);
    }
  };

  const triggerClass = (active: boolean) => {
    return [
      "cursor-pointer",
      "text-sm",
      "font-medium",
      "border-b-2",
      "rounded-none",
      "px-1",
      "py-1.5",
      "bg-transparent",
      "data-[state=open]:bg-transparent",
      "focus:bg-transparent",
      active
        ? "border-[var(--text-primary)] text-[var(--text-primary)]"
        : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]",
    ].join(" ");
  };

  const menuItemClass = (item: NavigationItem) => {
    return `cursor-pointer ${
      isActive(item.href) ? "font-medium text-[var(--text-primary)]" : ""
    }`;
  };

  return (
    <nav aria-label="Main navigation">
      <Menubar className="border-none bg-transparent p-0 gap-6 h-auto">
        {primaryItems.map((item) => (
          <MenubarMenu key={item.id}>
            <MenubarTrigger
              onClick={() => handleItemClick(item)}
              className={triggerClass(isActive(item.href))}
            >
              {item.label}
            </MenubarTrigger>
          </MenubarMenu>
        ))}

        {actionItems.length > 0 && (
          <MenubarMenu>
            <MenubarTrigger
              className={triggerClass(isGroupActive(actionItems))}
            >
              Actions
            </MenubarTrigger>

            <MenubarContent
              align="start"
              className="bg-[var(--bg-surface)] border-[var(--border)]"
            >
              {actionItems.map((item) => (
                <MenubarItem
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={menuItemClass(item)}
                >
                  {item.label}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        )}

        {adminItems.length > 0 && (
          <MenubarMenu>
            <MenubarTrigger className={triggerClass(isGroupActive(adminItems))}>
              Admin
            </MenubarTrigger>

            <MenubarContent
              align="start"
              className="bg-[var(--bg-surface)] border-[var(--border)]"
            >
              {adminItems.map((item) => (
                <MenubarItem
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={menuItemClass(item)}
                >
                  {item.label}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        )}

        {helpItems.length > 0 && (
          <MenubarMenu>
            <MenubarTrigger className={triggerClass(isGroupActive(helpItems))}>
              Help
            </MenubarTrigger>

            <MenubarContent
              align="end"
              className="min-w-60 bg-[var(--bg-surface)] border-[var(--border)]"
            >
              {helpItems.map((item) => (
                <MenubarItem
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={menuItemClass(item)}
                >
                  {item.label}
                </MenubarItem>
              ))}
            </MenubarContent>
          </MenubarMenu>
        )}
      </Menubar>
    </nav>
  );
}
