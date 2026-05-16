import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";
import { cn } from "@/../utilities/utils";

interface PageSkeletonProps {
  /** nr of content rows to render */
  rows?: number;
  /** Show a page heading skeleton above rows */
  showHeading?: boolean;
  className?: string;
}

// generic loading state for async page content

export function PageSkeleton({
  rows = 4,
  showHeading = true,
  className,
}: PageSkeletonProps) {
  return (
    <div
      className={cn("space-y-4 animate-pulse", className)}
      aria-busy="true"
      aria-label="Loading content"
    >
      {showHeading && (
        <div className="space-y-2">
          <Skeleton className="h-8 w-56 bg-[--bg-elevated]" />
          <Skeleton className="h-4 w-80 bg-[--bg-elevated]" />
        </div>
      )}

      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-12 w-full bg-[--bg-elevated] rounded-md"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
