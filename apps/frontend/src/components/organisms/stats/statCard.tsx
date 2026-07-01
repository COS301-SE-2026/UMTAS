import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";

export interface stats {
  title: string;
  description?: string;
  footer?: string | ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function StatCard({
  title,
  description,
  footer,
  children,
  className,
}: stats) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>

        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent>{children}</CardContent>

      <CardFooter>
        <div className="text-sm text-muted-foreground w-full">{footer}</div>
      </CardFooter>
    </Card>
  );
}
