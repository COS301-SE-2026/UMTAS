import React from "react";
import { ThemeToggle } from "@/components/atoms/auth/ThemeToggle";

interface AuthPageTemplateProps {
  children: React.ReactNode;
}

export function AuthPageTemplate({ children }: AuthPageTemplateProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-base)] px-4 py-12">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <main className="w-full flex items-center justify-center" role="main">
        {children}
      </main>
    </div>
  );
}
