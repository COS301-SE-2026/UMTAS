import { Progress } from "@/components/atoms/baseShadcn/progress";

interface AttendanceCounterProps {
  numberAttended: number;
  numberExpected: number;
}

export default function AttendanceCounter({
  numberAttended,
  numberExpected,
}: AttendanceCounterProps) {
  let percentage = 0;

  if (numberAttended > 0 && numberExpected > 0) {
    percentage = (numberAttended / numberExpected) * 100;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-2">
        <p className="text-sm">Attendance</p>
        <p className="text-sm text-[var(--text-secondary)]">
          {" "}
          {numberAttended} / {numberExpected}
        </p>
      </div>
      <Progress value={percentage} />
    </div>
  );
}
