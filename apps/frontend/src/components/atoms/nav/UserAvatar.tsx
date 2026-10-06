import * as React from "react";
import { cn } from "@/../utilities/utils";

interface UserAvatarProps extends Omit<React.ComponentProps<"button">, "name"> {
  name?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, className, ...props }: UserAvatarProps) {
  const initials = name ? getInitials(name) : "U";

  return (
    <button
      type="button"
      data-testid="click-avatar"
      aria-label={name ? `Account menu for ${name}` : "Account menu"}
      className={cn(
        "inline-flex items-center justify-center",
        "h-8 w-8 rounded-full",
        "bg-[var(--bg-elevated)] border border-[var(--border)]",
        "text-[var(--text-primary)] text-xs font-semibold",
        "select-none shrink-0 cursor-pointer",
        "transition-colors duration-[var(--duration-fast)] ease-[var(--easing-default)]",
        "hover:bg-[var(--bg-surface)]",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)]",
        className,
      )}
      {...props}
    >
      {initials}
    </button>
  );
}
