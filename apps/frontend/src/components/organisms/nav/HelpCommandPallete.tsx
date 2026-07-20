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

  const pages: HelpPageGroup[] = [
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
          id: "tutorials",
          children: "Tutorials",
          icon: "PlayIcon",
          href: "/tutorials",
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
