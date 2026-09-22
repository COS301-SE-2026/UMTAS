import { Suspense } from "react";
import { AttendanceCheckInPanel } from "@/components/organisms/attendance/AttendanceCheckInPanel";
export default function AttendanceCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full max-w-2xl px-6 py-6 text-sm text-[var(--text-secondary)]">
          Loading check-in…
        </div>
      }
    >
      <AttendanceCheckInPanel />;
    </Suspense>
  );
}
