import { useMutation, useQueryClient } from "@tanstack/react-query";
import posthog from "posthog-js";
import { authClient } from "@/lib/auth-client";
import { UserDetails } from "@/lib/userclass/userClass";

export class FreshSessionRequiredError extends Error {
  constructor() {
    super("fresh-session-required");
    this.name = "FreshSessionRequiredError";
  }
}

interface DeleteUserError {
  code?: string;
  message?: string;
  status?: number;
}

export function isFreshSessionError(error: DeleteUserError): boolean {
  return (
    error.code === "SESSION_EXPIRED" ||
    /session.*(expired|fresh)/i.test(error.message ?? "")
  );
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const result = await authClient.deleteUser();
      if (result.error) {
        if (isFreshSessionError(result.error)) {
          throw new FreshSessionRequiredError();
        }
        throw new Error(
          result.error.message ?? "Could not delete your account.",
        );
      }
    },
    onSuccess: () => {
      posthog.reset();
      UserDetails.storeUniDetails(undefined);
      queryClient.clear();
      window.location.assign("/dashboard?accountDeleted=1");
    },
  });
}
