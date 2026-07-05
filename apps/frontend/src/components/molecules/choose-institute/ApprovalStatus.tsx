import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";
import { uniDto } from "@/components/templates/choose-institute/queries/builders";

interface ApprovalStatusProps {
  uni: uniDto;
}
// so this goes and provides access control
export function ApprovalStatus({ uni }: ApprovalStatusProps) {
  if (status === null) return null;

  if (status === "approved") {
    return (
      <Alert variant="success">
        <AlertTitle>Role approved</AlertTitle>
        <AlertDescription>
          Your role has been approved for {uni.UniversityName}. You can now
          access the university&apos;s resources.
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "rejected") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Role rejected</AlertTitle>
        <AlertDescription>
          Your role has been rejected for {uni.UniversityName}. Please contact
          the university for more information.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="default">
      <AlertTitle>Role not yet approved</AlertTitle>
      <AlertDescription>
        Your role has not yet been approved for {uni.UniversityName}. Please
        wait for the approval process to complete.
      </AlertDescription>
    </Alert>
  );
}
