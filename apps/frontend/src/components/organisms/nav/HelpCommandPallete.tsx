"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CommandPalette, { getItemIndex, IconName } from "react-cmdk";
import "react-cmdk/dist/cmdk.css";
import { HelpPageGroup, HelpPageItem } from "@/types/HelpCommandPallete";
import { MessageCircleQuestionIcon } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

export function HelpCommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
  type ExtendedHelpItem = HelpPageItem & { action?: () => void; href?: string };
  const pages: HelpPageGroup[] = [
    {
      heading: "Quick Actions",
      id: "actions",
      items: [
        {
          id: "run-tutorial",
          children: "Run Tutorial for this Page",
          icon: "PlayIcon",

          action: () => window.dispatchEvent(new Event("start-tutorial")),
        },
      ] as ExtendedHelpItem[],
    },
    {
      heading: "Application Pages",
      id: "app-pages",
      items: [
        {
          id: "dashboard",
          children: "Dashboard",
          icon: "HomeIcon",
          href: "/dashboard",
        },
        {
          id: "builder",
          children: "Timetable Builder",
          icon: "CalendarIcon",
          href: "/builder",
        },
        {
          id: "schedules",
          children: "Schedules",
          icon: "ClockIcon",
          href: "/schedules",
        },
        {
          id: "course-management",
          children: "Course Management",
          icon: "AcademicCapIcon",
          href: "/course-management",
        },
        {
          id: "role-management",
          children: "Role Management",
          icon: "UserGroupIcon",
          href: "/role-management",
        },
        // {
        //   id: "choose-institute",
        //   children: "Choose Institute",
        //   icon: "BuildingOfficeIcon",
        //   href: "/choose-institute",
        // },
        // {
        //   id: "brand-style",
        //   children: "Brand Style",
        //   icon: "SwatchIcon",
        //   href: "/brand-style",
        // },
      ],
    },
    {
      heading: "Authentication",
      id: "auth",
      items: [
        {
          id: "login",
          children: "Login",
          icon: "ArrowRightOnRectangleIcon",
          href: "/login",
        },
        {
          id: "register",
          children: "Register",
          icon: "UserPlusIcon",
          href: "/register",
        },
        {
          id: "forgot-password",
          children: "Forgot Password",
          icon: "KeyIcon",
          href: "/forgot-password",
        },
        {
          id: "reset-password",
          children: "Reset Password",
          icon: "ArrowPathIcon",
          href: "/reset-password",
        },
      ],
    },
    {
      heading: "Help & Resources",
      id: "resources",
      items: [
        {
          id: "faq",
          children: "Frequently Asked Questions",
          icon: "QuestionMarkCircleIcon",
          href: "/faq",
        },
        {
          id: "help-centre",
          children: "Help Centre",
          icon: "BookOpenIcon",
          href: "/help",
        },
      ],
    },
  ];

  return (
    <>
      <Button
        id="help-command-palette-btn"
        variant="default"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105"
        aria-label="Toggle Help Menu"
      >
        <MessageCircleQuestionIcon className="h-6 w-6" />
      </Button>

      <CommandPalette
        onChangeSearch={setSearch}
        onChangeOpen={setIsOpen}
        search={search}
        isOpen={isOpen}
        page="root"
      >
        <CommandPalette.Page id="root">
          {pages.length ? (
            pages.map((list) => (
              <CommandPalette.List key={list.id} heading={list.heading}>
                {list.items.map(({ id, ...rest }) => (
                  <CommandPalette.ListItem
                    key={id}
                    index={getItemIndex(pages, id)}
                    {...rest}
                    onClick={() => {
                      if (rest.href) {
                        router.push(rest.href);
                        setIsOpen(false);
                      }
                      if (rest.action) {
                        rest.action();
                        setIsOpen(false);
                      }
                    }}
                  />
                ))}
              </CommandPalette.List>
            ))
          ) : (
            <CommandPalette.FreeSearchAction />
          )}
        </CommandPalette.Page>
      </CommandPalette>
    </>
  );
}
