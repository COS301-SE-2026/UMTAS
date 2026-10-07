import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clearGoogleCalendarTokenCache } from "@/lib/auth/google-calendar";
import { RevokeGoogleCalendarAccessBuilder } from "./builders";
import { LINKED_ACCOUNTS_QUERY_KEY } from "./useLinkedAccounts";

export function useRevokeGoogleAccess() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      new RevokeGoogleCalendarAccessBuilder().send({ body: {} }),
    onSuccess: async () => {
      toast.success("UMTAS no longer has access to your Google Calendar.");
      await queryClient.invalidateQueries({
        queryKey: LINKED_ACCOUNTS_QUERY_KEY,
      });
      clearGoogleCalendarTokenCache();
    },
  });
}
