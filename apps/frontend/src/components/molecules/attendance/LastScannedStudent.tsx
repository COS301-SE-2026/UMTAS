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
    <Card>
      <CardHeader>
        <CardTitle>Last Scan</CardTitle>
      </CardHeader>

      <CardContent>
        {studentNumber ? (
          <p className="text-2xl font-semibold">{studentNumber}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Scan a student card</p>
        )}
      </CardContent>
    </Card>
  );
}
