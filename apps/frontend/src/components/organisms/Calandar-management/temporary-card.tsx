import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { ReactNode } from "react";
import { RestrictionTypes } from "../../../../utilities/Calendar-Builders/RestrictionManagement";

interface props {
  children?: ReactNode;
}
export default function CalCard({ children }: props) {
  return (
    <Card className="flex flex-row px-2 items-center w-[95%] h-30">
      <CardContent className="w-full justify-between flex flex-row ">
        {children}
      </CardContent>
    </Card>
  );
}
