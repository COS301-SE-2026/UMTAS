import React from "react";
import { Label } from "@/components/atoms/baseShadcn/label";
import { cn } from "@/../utilities/utils";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label
        htmlFor={id}
        className="text-[14px] font-medium text-[var(--text-primary)]"
      >
        {label}
      </Label>

      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{
              id?: string;
              "aria-describedby"?: string;
            }>,
            {
              id,
              "aria-describedby": error ? `${id}-error` : undefined,
            },
          );
        }
        return child;
      })}

      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[12px] text-[var(--error-text)] mt-0.5"
        >
          {error}
        </p>
      )}
    </div>
  );
}
