import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import AttendanceCounter from "@/components/organisms/attendance/AttendanceCounter";
import { LastScannedStudent } from "@/components/organisms/attendance/LastScannedStudent";

export default function ScannerTemplate() {
  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
          Attendance Scanner
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Scan Student Cards to Record Attendance
        </p>
      </div>
      <div className="flex flex-col items-center gap-4 w-full max-w-md">
        <div>
          <Badge variant="secondary">Ready to Scan</Badge>
        </div>
        <div className="aspect-video w-full rounded-xl border-2"></div>
        <div className="w-full">
          <AttendanceCounter numberAttended={20} numberExpected={50} />
        </div>
        <div className="w-full pb-8">
          <LastScannedStudent studentNumber={null} />
        </div>
      </div>
    </div>
  );
}
