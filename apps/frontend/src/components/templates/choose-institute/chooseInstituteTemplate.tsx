import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { InstituteSelector } from "@/components/organisms/choose-institute/instituteSelector";

interface ChooseInstituteTemplateProps {
  onClose?: () => void;
}

export function ChooseInstituteTemplate({
  onClose,
}: ChooseInstituteTemplateProps) {
  return (
    <Card className="mx-auto min-w-md bg-[var(--bg-surface)]">
      <CardHeader>
        <CardTitle>Choose Institute</CardTitle>
      </CardHeader>
      <CardContent>
        <InstituteSelector onClose={onClose} />
      </CardContent>
    </Card>
  );
}
