import { Progress } from "@/components/atoms/baseShadcn/progress";

interface AttendanceCounterProps {
  attended: number;
  expected: number;
}

export function AttendanceCounter({
  attended,
  expected,
}: AttendanceCounterProps) {
  const percentage = expected > 0 ? (attended / expected) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Attendance</p>

        <p className="text-sm text-muted-foreground">
          {attended} / {expected}
        </p>
      </div>

      <Progress value={percentage} />
    </div>
  );
}
