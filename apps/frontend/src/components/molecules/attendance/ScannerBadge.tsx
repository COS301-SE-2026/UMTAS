import { Badge } from "@/components/atoms/baseShadcn/badge";

interface ScannerBadgeProps {
  status: "READY" | "SUCCESS" | "ERROR";
}

export function ScannerBadge({ status }: ScannerBadgeProps) {
  if (status === "SUCCESS") {
    return (
      <Badge variant="secondary" className="text-[var(--error-success)]">
        Success
      </Badge>
    );
  }

  if (status === "ERROR") {
    return (
      <Badge variant="secondary" className="text-[var(--error-text)]">
        Error
      </Badge>
    );
  }

  return <Badge variant="secondary">Ready to Scan</Badge>;
}
