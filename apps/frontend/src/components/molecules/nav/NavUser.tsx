"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import { UserAvatar } from "@/components/atoms/nav/UserAvatar";
import { ThemeToggle } from "@/components/atoms/auth/ThemeToggle";
import { Button } from "@/components/atoms/baseShadcn/button";
import { signOut, useSession } from "@/../utilities/auth-client";
import { UserDetails } from "@/lib/userclass/userClass";

interface NavUserProps {
  name?: string | null;
}

export function NavUser({ name: nameProp }: NavUserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const [needsRole, setNeedsRole] = useState(false);

  const name = session?.user?.name ?? nameProp;
  const isLoggedIn = !!session?.user;

  useEffect(() => {
    const check = () => setNeedsRole(!UserDetails.getUniDetails()?.role);
    check();
    window.addEventListener("focus", check);
    window.addEventListener("storage", check);
    window.addEventListener(UserDetails.changeEvent, check);
    return () => {
      window.removeEventListener("focus", check);
      window.removeEventListener("storage", check);
      window.removeEventListener(UserDetails.changeEvent, check);
    };
  }, [pathname, session]);

  async function handleSignOut() {
    UserDetails.storeUniDetails(undefined);

    await signOut({
      fetchOptions: {
        onSuccess: () => router.push("/login"),
      },
    });
  }

  async function handleLogin() {
    router.push("/login");
  }

  return (
    <div className="flex items-center gap-3">
      <ThemeToggle />

      {!isLoggedIn && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogin}
          aria-label="Sign in"
          className="gap-1.5 text-[--text-secondary] hover:text-[--text-primary]"
        >
          <LogIn size={15} aria-hidden />
          <span className="hidden sm:inline">Sign in</span>
        </Button>
      )}

      {isLoggedIn && (
        <>
          <div className="relative flex items-center gap-2">
            <UserAvatar name={name} />

            {needsRole && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center pointer-events-none z-50">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[var(--warning-bg)]" />
                <div className="bg-[var(--warning-bg)] text-[var(--error-text)] text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md">
                  Action Required
                </div>
              </div>
            )}
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
