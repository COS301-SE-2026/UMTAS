import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/baseShadcn/card";
import { InstituteSelector } from "@/components/organisms/choose-institute/instituteSelector";
import { UserDetails } from "@/lib/userclass/userClass";

interface ChooseInstituteTemplateProps {
  onClose?: () => void;
}

export function ChooseInstituteTemplate({
  onClose,
}: ChooseInstituteTemplateProps) {
  const uni = UserDetails.getUniDetails();

  return (
    <Card className="mx-auto min-w-md bg-[var(--bg-surface)]">
      <CardHeader>
        <CardTitle>Choose Institute</CardTitle>
        <br />
        {uni && <>Current University : {uni.UniversityName}</>}
      </CardHeader>
      <CardContent>
        <InstituteSelector onClose={onClose} />
      </CardContent>
    </Card>
  );
}
