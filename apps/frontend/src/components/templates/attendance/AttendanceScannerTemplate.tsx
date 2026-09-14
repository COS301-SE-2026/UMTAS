import { AttendanceScanner } from "@/components/organisms/attendance/AttendanceScanner";

export function AttendanceScannerTemplate() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 p-4">
      <div>
        <h1 className="text-2xl font-bold">Attendance Scanner</h1>

        <p className="text-sm text-muted-foreground">
          Scan student cards to record attendance.
        </p>
      </div>

      <AttendanceScanner />
    </main>
  );
}
