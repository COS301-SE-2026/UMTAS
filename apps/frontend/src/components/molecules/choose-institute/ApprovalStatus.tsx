import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/atoms/baseShadcn/alert";

interface ApprovalStatusProps {
  status: "approved" | "pending" | "rejected" | null;
  universityName: string;
}

export function ApprovalStatus({
  status,
  universityName,
}: ApprovalStatusProps) {
  if (status === "approved") {
    return (
      <Alert variant="success">
        <AlertTitle>Role approved</AlertTitle>
        <AlertDescription>
          Your role has been approved for {universityName}. You can now access
          the university&apos;s resources.
        </AlertDescription>
      </Alert>
    );
  } else if (status === "rejected") {
    return (
      <Alert variant="destructive">
        <AlertTitle>Role rejected</AlertTitle>
        <AlertDescription>
          Your role has been rejected for {universityName}. Please contact the
          university for more information.
        </AlertDescription>
      </Alert>
    );
  } else if (status === "pending") {
    return (
      <Alert variant="default">
        <AlertTitle>Role not yet approved</AlertTitle>
        <AlertDescription>
          Your role has not yet been approved for {universityName}. Please wait
          for the approval process to complete.
        </AlertDescription>
      </Alert>
    );
  }
}
