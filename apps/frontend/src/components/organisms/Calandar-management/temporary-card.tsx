import { Card, CardContent } from "@/components/atoms/baseShadcn/card";
import { ReactNode } from "react";

interface props {
  children?: ReactNode;
}
export default function CalCard({ children }: props) {
  return (
    <Card className="flex  lg:px-2 items-center w-75 capitalize  md:w-125 h-auto md::h-50 ">
      <CardContent className="w-full items-center  ">{children}</CardContent>
    </Card>
  );
}
