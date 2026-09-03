import { authClient } from "@/lib/auth-client";
import { getQueryClient } from "@/components/tanstack/getQueryClient";

const RETURN_TO_KEY = "umtas-google-calendar-return-to";
export const GOOGLE_CALENDAR_TOKEN_QUERY_KEY = [
  "google-calendar",
  "token",
] as const;
export const GOOGLE_CALENDAR_PERMISSIONS_QUERY_KEY = [
  "google-calendar",
  "permissions",
] as const;
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendars",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events",
] as const;

export interface GoogleCalendarToken {
  accessToken: string;
  expiresAt: string;
  scope: string;
}

export class ConsentRequiredError extends Error {
  constructor() {
    super("google-calendar-consent-required");
    this.name = "ConsentRequiredError";
  }
}

function betterAuthError(
  operation: string,
  error: { message?: string } | null,
) {
  return new Error(
    `${operation}: ${error?.message ?? "Unknown better-auth error"}`,
  );
}

async function getGoogleAccount() {
  const accounts = await authClient.listAccounts();
  if (accounts.error) {
    throw betterAuthError("Could not list linked accounts", accounts.error);
  }

  return accounts.data?.find((account) => account.providerId === "google");
}

export async function hasGoogleCalendarPermissions(): Promise<boolean> {
  const googleAccount = await getGoogleAccount();
  return Boolean(
    googleAccount &&
    REQUIRED_SCOPES.every((scope) => googleAccount.scopes.includes(scope)),
  );
}

export async function fetchGoogleCalendarToken(): Promise<GoogleCalendarToken> {
  const googleAccount = await getGoogleAccount();
  if (
    !googleAccount ||
    REQUIRED_SCOPES.some((scope) => !googleAccount.scopes.includes(scope))
  ) {
    throw new ConsentRequiredError();
  }

  const token = await authClient.getAccessToken({
    providerId: "google",
    accountId: googleAccount.accountId,
  });
  if (token.error || !token.data) {
    throw betterAuthError("Could not get Google Calendar token", token.error);
  }

  const rawExpiresAt = token.data.accessTokenExpiresAt as
    Date | string | undefined;
  const parsedExpiresAt = rawExpiresAt
    ? new Date(
        rawExpiresAt instanceof Date ? rawExpiresAt.getTime() : rawExpiresAt,
      )
    : undefined;

  return {
    accessToken: token.data.accessToken,
    expiresAt:
      parsedExpiresAt && !Number.isNaN(parsedExpiresAt.getTime())
        ? parsedExpiresAt.toISOString()
        : new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    scope: googleAccount.scopes.join(" "),
  };
}

export async function startCalendarConsent(returnTo: string): Promise<void> {
  window.sessionStorage.setItem(RETURN_TO_KEY, returnTo);
  const result = await authClient.linkSocial({
    provider: "google",
    scopes: [...REQUIRED_SCOPES],
    callbackURL: "/auth-callback/google-calendar?status=granted",
    errorCallbackURL: "/auth-callback/google-calendar?status=denied",
    disableRedirect: true,
  });
  if (result.error) {
    window.sessionStorage.removeItem(RETURN_TO_KEY);
    throw betterAuthError(
      "Could not start Google Calendar consent",
      result.error,
    );
  }
  if (result.data?.url) {
    window.location.href = result.data.url;
    return;
  }

  window.sessionStorage.removeItem(RETURN_TO_KEY);
  throw new Error("Could not start Google Calendar consent: no redirect URL");
}

export function takeCalendarConsentReturnTo(): string {
  const value = window.sessionStorage.getItem(RETURN_TO_KEY);
  window.sessionStorage.removeItem(RETURN_TO_KEY);
  return value?.startsWith("/") && !/[\\/]/.test(value[1] ?? "") ? value : "/";
}

export function calendarConsentReturnUrl(status: string | null): string {
  const returnTo = takeCalendarConsentReturnTo();
  const url = new URL(returnTo, window.location.origin);
  url.searchParams.set(
    "calendarConsent",
    status === "granted" ? "granted" : "denied",
  );
  return `${url.pathname}${url.search}${url.hash}`;
}

export function finishCalendarConsent(
  status: string | null,
  replace: (url: string) => void = (url) => window.location.replace(url),
): void {
  if (status === "granted") clearGoogleCalendarTokenCache();
  const returnUrl = calendarConsentReturnUrl(status);
  replace(returnUrl);
}

export function clearGoogleCalendarTokenCache(): void {
  void getQueryClient().invalidateQueries({
    queryKey: GOOGLE_CALENDAR_TOKEN_QUERY_KEY,
  });
  void getQueryClient().invalidateQueries({
    queryKey: GOOGLE_CALENDAR_PERMISSIONS_QUERY_KEY,
  });
}
