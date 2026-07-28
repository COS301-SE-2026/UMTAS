"use client";

import { useSession } from "@/lib/auth-client";

export function UserGreeting() {
  const { data: session } = useSession();
  const userName = session?.user?.name;

  if (!userName) {
    return <span className="inline-block min-w-[150px]" />;
  }

  return <span>Welcome {userName.split(" ")[0]}.</span>;
}
