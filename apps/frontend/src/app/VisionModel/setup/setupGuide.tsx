import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";

export default function VM_GUIDE() {
  return (
    <Card className="w-[min(90vw,960px)] max-h-[85vh] overflow-auto border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
      <CardHeader className="space-y-1 border-b border-[var(--border)]">
        <CardTitle className="text-lg font-semibold text-[var(--text-primary)]">
          Setup Guide for Vision Model
        </CardTitle>
        <CardDescription className="text-sm text-[var(--text-secondary)]">
          Select an existing session or create a new one to save Lecture Watch
          results.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 p-4">
        <div>
          <h2 className="text-[15px] font-medium leading-[1.4] text-[var(--text-primary)]">
            Use existing session
          </h2>
          <p className="mt-1 text-xs leading-[1.5] text-[var(--text-secondary)]">
            Continue analysing an existing session and save new results to it.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
