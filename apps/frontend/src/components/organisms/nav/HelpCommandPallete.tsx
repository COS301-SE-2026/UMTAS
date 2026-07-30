"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CommandPalette, { getItemIndex } from "react-cmdk";
import "react-cmdk/dist/cmdk.css";
import { HelpPageGroup } from "@/types/HelpCommandPallete";
import { MessageCircleQuestionIcon } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

import Tutorial from "@/components/organisms/nav/Tutorial";

const cmdkTutorialSteps = [
  {
    target: '[data-tour="dashboard"]',
    content: "Jump straight to your Dashboard from here.",
  },
  {
    target: '[data-tour="builder"]',
    content: "Open the Timetable Builder to start building schedules.",
  },
  {
    target: '[data-tour="schedules"]',
    content: "View all your saved Schedules here.",
  },
  {
    target: '[data-tour="course-management"]',
    content: "Manage your courses in Course Management.",
  },
  {
    target: '[data-tour="role-management"]',
    content: "Control user roles and permissions here.",
  },
  {
    target: '[data-tour="login"]',
    content: "Go to the Login page.",
  },
  {
    target: '[data-tour="register"]',
    content: "Register a new account from here.",
  },
  {
    target: '[data-tour="forgot-password"]',
    content: "Recover access if you've forgotten your password.",
  },
  {
    target: '[data-tour="reset-password"]',
    content: "Reset your password from this page.",
  },
  {
    target: '[data-tour="faq"]',
    content: "Check the FAQ for answers to common questions.",
  },
  {
    target: '[data-tour="run-tutorial"]',
    content:
      "Click this to run a step-by-step tutorial for whichever page you're currently on.",
  },
  {
    target: '[data-tour="cmdk-tutorial"]',
    content: "And this is the option you just used to start this tour!",
  },
];

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

  const pages: HelpPageGroup[] = [
    {
      heading: "Application Pages",
      id: "app-pages",
      items: [
        {
          id: "dashboard",
          children: "Dashboard",
          icon: "HomeIcon",
          href: "/dashboard",
          "data-tour": "cmdk-dashboard-item",
        },
        {
          id: "builder",
          children: "Timetable Builder",
          icon: "CalendarIcon",
          href: "/builder",
          "data-tour": "builder",
        },
        {
          id: "schedules",
          children: "Schedules",
          icon: "ClockIcon",
          href: "/schedules",
          "data-tour": "schedules",
        },
        {
          id: "course-management",
          children: "Course Management",
          icon: "AcademicCapIcon",
          href: "/course-management",
          "data-tour": "course-management",
        },
        {
          id: "role-management",
          children: "Role Management",
          icon: "UserGroupIcon",
          href: "/role-management",
          "data-tour": "role-management",
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
          "data-tour": "login",
        },
        {
          id: "register",
          children: "Register",
          icon: "UserPlusIcon",
          href: "/register",
          "data-tour": "register",
        },
        {
          id: "forgot-password",
          children: "Forgot Password",
          icon: "KeyIcon",
          href: "/forgot-password",
          "data-tour": "forgot-password",
        },
        {
          id: "reset-password",
          children: "Reset Password",
          icon: "ArrowPathIcon",
          href: "/reset-password",
          "data-tour": "reset-password",
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
          "data-tour": "faq",
        },
        {
          id: "user-manual",
          children: "User Manual",
          icon: "BookOpenIcon",
          href: "/tutorial",
        },
        {
          id: "run-tutorial",
          children: "Run Tutorial for this Page",
          icon: "PlayIcon",
          "data-tour": "run-tutorial",

          action: () => {
            window.dispatchEvent(new Event("begin-tut"));
          },
        },

        {
          id: "cmdk-tutorial",
          children: "How to use the Help Menu",
          icon: "InformationCircleIcon",
          closeOnSelect: false,
          "data-tour": "cmdk-tutorial",

          action: () => {
            window.dispatchEvent(new Event("begin-cmdk-tut"));
          },
        },
      ],
    },
  ];

  return (
    <>
      <Tutorial
        steps={cmdkTutorialSteps}
        wait={true}
        eventName="begin-cmdk-tut"
      />

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
                {list.items.map(({ id, action, href, ...rest }) => (
                  <CommandPalette.ListItem
                    key={id}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    index={getItemIndex(pages as any, id)}
                    {...rest}
                    onClick={() => {
                      if (action) {
                        action();
                      } else if (href) {
                        router.push(href);
                      }
                      if (id !== "cmdk-tutorial") {
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
