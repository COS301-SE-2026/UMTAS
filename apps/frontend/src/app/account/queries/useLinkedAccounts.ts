import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const LINKED_ACCOUNTS_QUERY_KEY = ["account", "linked"] as const;

export interface LinkedAccount {
  providerId: string;
  accountId: string;
  scopes: string[];
}

async function fetchLinkedAccounts(): Promise<LinkedAccount[]> {
  const result = await authClient.listAccounts();
  if (result.error) {
    throw new Error(result.error.message ?? "Could not list linked accounts");
  }
  return (result.data ?? []).map((account) => ({
    providerId: account.providerId,
    accountId: account.accountId,
    scopes: account.scopes ?? [],
  }));
}

export function useLinkedAccounts() {
  return useQuery({
    queryKey: LINKED_ACCOUNTS_QUERY_KEY,
    queryFn: fetchLinkedAccounts,
  });
}
