import { Badge } from "@/components/atoms/baseShadcn/badge";

interface ScannerStatusBadgeProps {
  status: "ready" | "success" | "error";
}

export function ScannerStatusBadge({ status }: ScannerStatusBadgeProps) {
  if (status === "success") {
    return <Badge>Attendance recorded</Badge>;
  }

  if (status === "error") {
    return <Badge variant="destructive">Scan failed</Badge>;
  }

  return <Badge variant="secondary">Ready to scan</Badge>;
}
