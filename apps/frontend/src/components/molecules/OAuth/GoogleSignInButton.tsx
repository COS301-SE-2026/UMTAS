/**
 * https://developers.google.com/identity/branding-guidelines

 * The onClick handler is provided externally and should call:
 *   signIn.social({ provider: "google", callbackURL: "/dashboard" })
 *
 * follows the BetterAuth socialProviders.google configuration.
 */

"use client";

import React from "react";
import { GoogleIcon } from "@/components/atoms/auth/GoogleIcon";
import { Loader2 } from "lucide-react";

interface GoogleSignInButtonProps {
  onClick: () => void;
  label?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onClick,
  label = "Continue with Google",
  isLoading = false,
  disabled = false,
}: GoogleSignInButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={label}
      className={[
        "flex w-full items-center justify-center gap-3",
        "h-9 px-4 rounded-lg",
        "border border-[#dadce0]",
        "bg-white",
        "text-[#3c4043] text-[14px] font-medium",
        "transition-colors duration-150",
        "hover:bg-[#f8f9fa] hover:border-[#c6c6c6]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#4285F4]",
        "active:bg-[#f1f3f4]",
        isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ fontFamily: "'Google Sans', 'DM Sans', sans-serif" }}
    >
      {isLoading ? (
        <Loader2
          size={18}
          className="animate-spin text-[#3c4043]"
          aria-hidden="true"
        />
      ) : (
        <GoogleIcon />
      )}
      <span>{label}</span>
    </button>
  );
}
