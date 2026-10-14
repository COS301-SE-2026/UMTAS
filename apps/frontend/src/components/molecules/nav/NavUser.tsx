"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, LogIn, LogOut, Settings } from "lucide-react";
import { UserAvatar } from "@/components/atoms/nav/UserAvatar";
import { ThemeToggle } from "@/components/atoms/auth/ThemeToggle";
import { Button } from "@/components/atoms/baseShadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/atoms/baseShadcn/dropdown-menu";
import Popup from "@/components/atoms/utility/floatContainer";
import { ChooseInstituteTemplate } from "@/components/templates/choose-institute/chooseInstituteTemplate";
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
  const [isInstituteOpen, setIsInstituteOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

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
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <UserAvatar name={name} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel className="flex flex-col gap-0.5 font-normal">
                  <span className="text-sm font-semibold text-[var(--text-primary)]">
                    {name}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">
                    {session?.user?.email}
                  </span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => setIsInstituteOpen(true)}>
                  <Building2 size={16} aria-hidden />
                  University
                  {needsRole && (
                    <span className="ml-auto text-xs text-[var(--text-secondary)]">
                      Action required
                    </span>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Settings size={16} aria-hidden />
                    Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void handleSignOut()}>
                  <LogOut size={16} aria-hidden />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {needsRole && !isMenuOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center pointer-events-none z-50">
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[8px] border-b-[var(--warning-bg)]" />
                <div className="bg-[var(--warning-bg)] text-[var(--error-text)] text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md">
                  Action Required
                </div>
              </div>
            )}
          </div>

          {isInstituteOpen && (
            <Popup>
              <div
                className="w-fit text-center"
                data-testid="dashboard-popup-div"
                onClick={(e) => e.stopPropagation()}
              >
                <ChooseInstituteTemplate
                  onClose={() => setIsInstituteOpen(false)}
                />
              </div>
            </Popup>
          )}
        </>
      )}
    </div>
  );
}
