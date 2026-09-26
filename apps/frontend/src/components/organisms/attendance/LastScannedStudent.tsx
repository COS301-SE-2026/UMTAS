import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";

interface LastScannedStudentProps {
  studentNumber: string | null;
}

export function LastScannedStudent({ studentNumber }: LastScannedStudentProps) {
  return (
    <Card className="bg-[var(--bg-surface)] shadow-md">
      <CardHeader>
        <CardTitle>Last Scanned Student</CardTitle>
      </CardHeader>

      <CardContent>
        {studentNumber ? (
          <p className="text-[var(--text-primary)]">{studentNumber}</p>
        ) : (
          <p className="text-[var(--text-secondary)]">Scan a Student</p>
        )}
      </CardContent>
    </Card>
  );
}
