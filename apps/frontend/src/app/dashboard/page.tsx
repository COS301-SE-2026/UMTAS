import { Suspense } from "react";
import { PageSkeleton } from "@/components/atoms/nav/PageSkeleton";

export const metadata = { title: "Home" };

/**
 * Dashboard, placeholder for the Home route
 * Will be fleshed out post demo 1
 */
export default function DashboardPage() {
  return (
    <Suspense fallback={<PageSkeleton rows={3} />}>
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold text-[--text-primary]">Home</h1>
        <p className="text-[--text-secondary] text-sm">
          Welcome to UMTAS. Use the navigation above to get started.
        </p>
      </div>
    </Suspense>
  );
}
