import { Badge } from "@/components/atoms/baseShadcn/badge";
import { Progress } from "@/components/atoms/baseShadcn/progress";
import AttendanceCounter from "@/components/organisms/attendance/AttendanceCounter";
import { LastScannedStudent } from "@/components/organisms/attendance/LastScannedStudent";

export default function ScannerTemplate() {
  //   function BarcodeScanner() {
  //     return <></>;
  //   }

  //   function LastScannedStudent() {}
  return (
    <>
      <div className="flex items-center flex-col">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Attendance Scanner
          </h1>
          <p className="text-sm font-normal text-[var(--text-secondary)]">
            Scan Student Cards to Record Attendance
          </p>
        </div>
        <div className="mb-2">
          <Badge variant="secondary">Ready to Scan</Badge>
        </div>

        <div className="border-2 rounded-xl aspect-video w-[90%] md:w-[50%] mb-4">
          {/* Barcode scanner goes here */}
        </div>
        <div className="w-[50%] w-min-xl pb-8">
          <AttendanceCounter numberAttended={20} numberExpected={50} />
        </div>
        <div className="w-[50%]">
          <LastScannedStudent studentNumber={null} />
        </div>
      </div>
    </>
  );
}
