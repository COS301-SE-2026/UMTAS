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
      <div className={cn("max-w-0.9 px-0 sm:px-0 pt-8 pb-16", innerClassName)}>
        {children}
      </div>
    </main>
  );
}
