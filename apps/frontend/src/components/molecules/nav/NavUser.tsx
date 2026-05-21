"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { UserAvatar } from "@/components/atoms/nav/UserAvatar";
import { ThemeToggle } from "@/components/atoms/auth/ThemeToggle";
import { Button } from "@/components/atoms/baseShadcn/button";
import { signOut, useSession } from "@/../utilities/auth-client";

interface NavUserProps {
  name?: string | null;
}

export function NavUser({ name: nameProp }: NavUserProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const name = session?.user?.name ?? nameProp;
  const isLoggedIn = !!session?.user;

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

      {isLoggedIn && (
        <>
          <div className="flex items-center gap-2">
            <UserAvatar name={name} />
          </div>

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
        </>
      )}
    </div>
  );
}
