import { cn } from "@/../utilities/utils";
import { useState } from "react";
import Popup from "../utility/floatContainer";
import { ChooseInstituteTemplate } from "@/components/templates/choose-institute/chooseInstituteTemplate";
import { Button } from "../baseShadcn/button";

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
  const [selectAvatar, setSelectAvatar] = useState<boolean>(false);
  const initials = name ? getInitials(name) : "U";

  return (
    <span
      data-testid="click-avatar"
      aria-label={name ? `${name}'s avatar` : "User avatar"}
      className={cn(
        "inline-flex items-center justify-center",
        "h-8 w-8 rounded-full",
        "bg-[--bg-elevated] border border-[--border]",
        "text-[--text-primary] text-xs font-semibold",
        "select-none shrink-0",
        "cursor-pointer",
        className,
      )}
      onClick={() => {
        setSelectAvatar(true);
      }}
    >
      {selectAvatar && (
        <Popup>
          <div className="w-fit text-center">
            <ChooseInstituteTemplate onClose={() => setSelectAvatar(false)} />
            <div className="w-full mt-5 items-center justify-center flex"></div>
          </div>
        </Popup>
      )}
      {initials}
    </span>
  );
}
