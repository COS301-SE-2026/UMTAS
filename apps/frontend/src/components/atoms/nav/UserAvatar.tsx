import { cn } from "@/../utilities/utils";

interface UserAvatarProps {
  name?: string | null;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserAvatar({ name, className }: UserAvatarProps) {
  const initials = name ? getInitials(name) : "U";

  return (
    <span
      aria-label={name ? `${name}'s avatar` : "User avatar"}
      className={cn(
        "inline-flex items-center justify-center",
        "h-8 w-8 rounded-full",
        "bg-[--bg-elevated] border border-[--border]",
        "text-[--text-primary] text-xs font-semibold",
        "select-none shrink-0",
        className,
      )}
    >
      {initials}
    </span>
  );
}
