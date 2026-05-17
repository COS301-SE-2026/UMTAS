import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import { AppShellTemplate } from "@/components/templates/app/AppShellTemplate";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UMTAS",
    template: "%s | UMTAS",
  },
  description: "University Module Timetable Assistance System",
};

async function getServerSession() {
  try {
    const cookieHeader = (await headers()).get("cookie") ?? "";
    const res = await fetch(
      `${process.env.API_URL || "http://localhost:3001"}/api/auth/session`,
      {
        headers: { cookie: cookieHeader },
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await getServerSession();
  const userName = session?.user?.name ?? null;
  const userEmail = session?.user?.email ?? null;

  return (
    <html
      lang="en"
      className={`${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('umtas-theme') || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppShellTemplate userName={userName} userEmail={userEmail}>
          {children}
        </AppShellTemplate>
      </body>
    </html>
  );
}
