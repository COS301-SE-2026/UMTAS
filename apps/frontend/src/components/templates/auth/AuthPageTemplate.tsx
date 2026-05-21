import React from "react";

interface AuthPageTemplateProps {
  children: React.ReactNode;
}

export function AuthPageTemplate({ children }: AuthPageTemplateProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[var(--bg-base)] px-4 py-12">
      <main className="w-full flex items-center justify-center" role="main">
        {children}
      </main>
    </div>
  );
}
