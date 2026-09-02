import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { Skeleton } from "@/components/atoms/baseShadcn/skeleton";

export interface StatsProps {
  title: string;
  description?: string;
  footer?: string | ReactNode;
  children?: ReactNode;
  className?: string;
  isLoading?: boolean;
  icon?: ReactNode;
  value?: number | string;
}

export default function StatCard({
  title,
  description,
  footer,
  children,
  className,
  isLoading,
  icon,
  value,
}: StatsProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-7 w-20 my-1" />
        ) : (
          <div className="text-2xl font-bold">
            {value !== undefined ? value.toLocaleString() : ""}
          </div>
        )}
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
        {children}
      </CardContent>
      {footer && (
        <CardFooter>
          <div className="text-sm text-muted-foreground w-full">{footer}</div>
        </CardFooter>
      )}
    </Card>
  );
}
