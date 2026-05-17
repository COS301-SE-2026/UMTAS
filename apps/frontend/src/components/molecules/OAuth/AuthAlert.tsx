import React from "react";
import { Alert, AlertDescription } from "@/components/atoms/baseShadcn/alert";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/../utilities/utils";

interface AuthAlertProps {
  type: "error" | "success";
  message: string;
  className?: string;
}

export function AuthAlert({ type, message, className }: AuthAlertProps) {
  const isError = type === "error";

  return (
    <Alert
      role="alert"
      aria-live="assertive"
      className={cn(
        "border text-[14px] py-3 px-4",
        isError
          ? "border-[#7f1d1d] bg-[#7f1d1d]/10 text-[#fca5a5] dark:border-[#7f1d1d] dark:bg-[#7f1d1d]/10 dark:text-[#fca5a5] light:border-[#fee2e2] light:bg-[#fee2e2] light:text-[#991b1b]"
          : "border-[#14532d] bg-[#14532d]/10 text-[#86efac] dark:border-[#14532d] dark:bg-[#14532d]/10 dark:text-[#86efac]",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        {isError ? (
          <AlertCircle
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
        ) : (
          <CheckCircle2
            size={16}
            strokeWidth={1.5}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
        )}
        <AlertDescription className="text-[14px] leading-snug">
          {message}
        </AlertDescription>
      </div>
    </Alert>
  );
}
