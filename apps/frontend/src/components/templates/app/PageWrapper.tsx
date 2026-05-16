import { cn } from "@/../utilities/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}
export function PageWrapper({
  children,
  className,
  innerClassName,
}: PageWrapperProps) {
  return (
    <main
      className={cn("min-h-[calc(100dvh-3.5rem)] bg-[--bg-base]", className)}
    >
      <div
        className={cn(
          "mx-auto max-w-[1280px] px-4 sm:px-6 pt-8 pb-16",
          innerClassName,
        )}
      >
        {children}
      </div>
    </main>
  );
}
