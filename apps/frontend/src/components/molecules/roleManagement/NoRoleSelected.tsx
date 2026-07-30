import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/atoms/baseShadcn/card";
import Popup from "@/components/atoms/utility/floatContainer";
import { useRouter } from "next/router";
import { Button } from "@/components/atoms/baseShadcn/button";

export default function NoRoleSelected() {
  const router = useRouter();

  return (
    <Popup>
      <Card className="flex justify-center bg-[var(--bg-surface)] w-100">
        <CardHeader className="text-xl">No Permissions</CardHeader>
        <CardContent className="flex flex-col justify-center space-y-4">
          <p className="text-[var(--error-text)] text-md">
            Please Select a Role
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </Popup>
  );
}
