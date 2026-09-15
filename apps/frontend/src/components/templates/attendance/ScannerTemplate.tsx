import AttendanceScanner from "@/components/organisms/attendance/AttendanceScanner";

export default function ScannerTemplate() {
  // backend integration query will be called here
  //.....
  return (
    <div className="flex flex-col p-4">
      <div className="flex w-full max-w-md flex-col gap-6 mx-auto">
        <div className="w-full text-left">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Attendance Scanner
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Scan Student Cards to Record Attendance
          </p>
        </div>
        <AttendanceScanner
          // replace with expected attendance from backend integration
          expectedNumber={100}
        />
      </div>
    </div>
  );
}
