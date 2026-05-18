"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { UserAvatar } from "@/components/atoms/nav/UserAvatar";
import { ThemeToggle } from "@/components/atoms/auth/ThemeToggle";
import { Button } from "@/components/atoms/baseShadcn/button";
import { signOut, useSession } from "@/../utilities/auth-client";

export function NavUser() {
  const router = useRouter();
  const { data: session } = useSession();
  const name = session?.user?.name ?? null;

  async function handleSignOut() {
    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
      },
    });
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      {/* user id */}
      <div className="flex items-center gap-2">
        <UserAvatar name={name} />
        {name && (
          <span className="hidden sm:block text-sm font-medium text-[--text-primary] max-w-[160px] truncate">
            {name}
          </span>
        )}
      </div>

      {/* sign out */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSignOut}
        aria-label="Sign out"
        className="gap-1.5 text-[--text-secondary] hover:text-[--text-primary]"
      >
        <LogOut size={15} aria-hidden />
        <span className="hidden sm:inline">Sign out</span>
      </Button>
    </div>
  );
}
