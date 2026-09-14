"use client";

import { useSession } from "@/lib/auth-client";

export function useIsGuest(): { isGuest: boolean; isPending: boolean } {
  const { data: session, isPending } = useSession();
  const email = session?.user?.email;

  return {
    isGuest:
      typeof email === "string" &&
      email.startsWith("guest+") &&
      email.endsWith("@simulation.com"),
    isPending,
  };
}
