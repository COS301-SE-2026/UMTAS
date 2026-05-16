import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { headers } from "next/headers";
import { auth } from "@/../utilities/auth";
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
    default: "Vigil",
    template: "%s | Vigil",
  },
  description: "Made by Vigil.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let userName: string | null = null;
  let userEmail: string | null = null;

  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    userName = session?.user?.name ?? null;
    userEmail = session?.user?.email ?? null;
  } catch {
    // No session yet nav renders without user info, proxy handles redirect.
  }

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
