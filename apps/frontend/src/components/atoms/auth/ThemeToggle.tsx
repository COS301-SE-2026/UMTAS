"use client";

import { useSyncExternalStore, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/atoms/baseShadcn/button";

const THEME_KEY = "umtas-theme";
const THEME_CHANGE = "umtas-theme-change";

function getSnapshot(): boolean {
  const stored = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return stored === "dark" || (!stored && prefersDark);
}

function subscribe(callback: () => void): () => void {
  const mql = window.matchMedia("(prefers-color-scheme: dark)");
  mql.addEventListener("change", callback);
  window.addEventListener(THEME_CHANGE, callback);
  return () => {
    mql.removeEventListener("change", callback);
    window.removeEventListener(THEME_CHANGE, callback);
  };
}

export function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDark ? "dark" : "light",
    );
  }, [isDark]);

  function toggle() {
    localStorage.setItem(THEME_KEY, isDark ? "light" : "dark");
    window.dispatchEvent(new Event(THEME_CHANGE));
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="h-9 w-9 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors duration-150"
    >
      {isDark ? (
        <Sun size={16} strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Moon size={16} strokeWidth={1.5} aria-hidden="true" />
      )}
    </Button>
  );
}
