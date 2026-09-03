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
    <Card className="w-full max-w-md mx-auto bg-[var(--bg-surface)] p-4 sm:p-6 border-0 sm:border shadow-none sm:shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl sm:text-2xl">Choose Institute</CardTitle>
        {uni && <>Current University : {uni.UniversityName}</>}
      </CardHeader>
      <CardContent className="p-0">
        <InstituteSelector onClose={onClose} />
      </CardContent>
    </Card>
  );
}
