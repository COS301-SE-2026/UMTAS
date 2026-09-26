"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import CommandPalette, { filterItems, getItemIndex } from "react-cmdk";

import "react-cmdk/dist/cmdk.css";

import { MessageCircleQuestionIcon } from "lucide-react";

import { Button } from "@/components/atoms/baseShadcn/button";
import Tutorial from "@/components/organisms/nav/Tutorial";

import { UserDetails } from "@/lib/userclass/userClass";

import {
  executeNavigationAction,
  getVisibleNavigationItems,
  NavigationItem,
} from "@/types/Nav";

export function HelpCommandPalette() {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const [pendingCmdkTutorial, setPendingCmdkTutorial] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const universityDetails = UserDetails.getUniDetails();

  const visibleItems = useMemo(() => {
    return getVisibleNavigationItems({
      role: universityDetails?.role ?? undefined,
      universityName: universityDetails?.UniversityName,
    }).filter((item) => item.showInCommandPalette);
  }, [universityDetails?.role, universityDetails?.UniversityName]);

  const handleNavigationItem = useCallback(
    (item: NavigationItem) => {
      if (item.action) {
        executeNavigationAction(item.action);

        if (item.action !== "run-cmdk-tutorial") {
          setIsOpen(false);
        }

        return;
      }

      if (item.href) {
        router.push(item.href);
        setIsOpen(false);
      }
    },
    [router],
  );

  const commandGroups = useMemo(() => {
    const applicationItems = visibleItems.filter(
      (item) => item.section === "primary" || item.section === "actions",
    );

    const administrationItems = visibleItems.filter(
      (item) => item.section === "admin",
    );

    const helpItems = visibleItems.filter((item) => item.section === "help");

    const authenticationItems = visibleItems.filter(
      (item) => item.section === "auth",
    );

    const groups = [
      {
        heading: "Application Pages",
        id: "app-pages",
        items: applicationItems,
      },
      {
        heading: "Administration",
        id: "administration",
        items: administrationItems,
      },
      {
        heading: "Help & Resources",
        id: "resources",
        items: helpItems,
      },
      {
        heading: "Authentication",
        id: "authentication",
        items: authenticationItems,
      },
    ];

    return groups
      .filter((group) => group.items.length > 0)
      .map((group) => ({
        heading: group.heading,
        id: group.id,

        items: group.items.map((item) => ({
          id: item.id,
          children: item.label,
          icon: item.icon,
          keywords: item.keywords,

          "data-tour": item.id,

          closeOnSelect: item.action !== "run-cmdk-tutorial",

          onClick: () => {
            handleNavigationItem(item);
          },
        })),
      }));
  }, [visibleItems, handleNavigationItem]);

  const filteredPages = useMemo(() => {
    return filterItems(commandGroups, search);
  }, [commandGroups, search]);

  const cmdkTutorialSteps = useMemo(() => {
    return visibleItems.map((item) => ({
      target: `[data-tour="${item.id}"]`,
      content: item.tourContent,
    }));
  }, [visibleItems]);

  useEffect(() => {
    const handleTutorialRequest = () => {
      setSearch("");
      setIsOpen(true);

      if (cmdkTutorialSteps.length > 0) {
        setPendingCmdkTutorial(true);
      }
    };

    window.addEventListener("request-cmdk-tut", handleTutorialRequest);

    return () => {
      window.removeEventListener("request-cmdk-tut", handleTutorialRequest);
    };
  }, [cmdkTutorialSteps.length]);

  useEffect(() => {
    if (!isOpen || !pendingCmdkTutorial || cmdkTutorialSteps.length === 0) {
      return;
    }

    let animationFrameId = 0;

    const waitForCommandPalette = () => {
      const firstTarget = cmdkTutorialSteps[0]?.target;

      if (firstTarget && document.querySelector(firstTarget)) {
        window.dispatchEvent(new Event("begin-cmdk-tut"));

        setPendingCmdkTutorial(false);

        return;
      }

      animationFrameId = requestAnimationFrame(waitForCommandPalette);
    };

    animationFrameId = requestAnimationFrame(waitForCommandPalette);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, pendingCmdkTutorial, cmdkTutorialSteps]);

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
        onClick={() => setIsOpen((previous) => !previous)}
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
        placeholder="Search pages, actions and help..."
      >
        <CommandPalette.Page id="root">
          {filteredPages.length > 0 ? (
            filteredPages.map((list) => (
              <CommandPalette.List key={list.id} heading={list.heading}>
                {list.items.map(({ id, ...rest }) => (
                  <CommandPalette.ListItem
                    key={id}
                    index={getItemIndex(filteredPages, id)}
                    {...rest}
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
