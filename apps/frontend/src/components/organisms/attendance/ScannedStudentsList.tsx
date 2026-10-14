import { toast } from "sonner";

import { Button } from "@/components/atoms/baseShadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";

interface ScannedStudentsListProps {
  studentNumbers: string[];
}

export function ScannedStudentsList({
  studentNumbers,
}: ScannedStudentsListProps) {
  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(studentNumbers.join("\n"));
      toast.success("Copied", {
        description: `${studentNumbers.length} student numbers copied.`,
      });
    } catch {
      toast.error("Could not copy student numbers");
    }
  };

  return (
    <Card className="w-full bg-[var(--bg-surface)] text-left shadow-md">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Scanned Students ({studentNumbers.length})</CardTitle>

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={studentNumbers.length === 0}
          onClick={() => void copyAll()}
        >
          Copy all
        </Button>
      </CardHeader>

      <CardContent>
        {studentNumbers.length > 0 ? (
          <ul className="max-h-60 overflow-y-auto font-mono text-sm text-[var(--text-primary)]">
            {[...studentNumbers].reverse().map((studentNumber) => (
              <li key={studentNumber}>{studentNumber}</li>
            ))}
          </ul>
        ) : (
          <p className="text-[var(--text-secondary)]">
            No students scanned yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
