import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

export default function CalCard({ children }: Props) {
  return (
    <Card className="w-full bg-[var(--bg-surface)] capitalize shadow-sm">
      <CardContent className="w-full">{children}</CardContent>
    </Card>
  );
}
