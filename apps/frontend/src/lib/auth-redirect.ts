const AUTH_REDIRECT_STORAGE_KEY = "umtas-auth-next";
const DEFAULT_AUTH_REDIRECT = "/dashboard";
const BLOCKED_PATHS = new Set([
  "/login",
  "/register",
  "/forgot-password",
  "/verify-pending",
  "/verify-email",
  "/reset-password",
  "/auth-callback",
]);

interface SearchParamsLike {
  get(name: string): string | null;
}

export function sanitizeAuthRedirectTarget(
  target: string | null | undefined,
): string | null {
  if (!target) return null;

  const trimmed = target.trim();
  if (!trimmed || !trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return null;
  }

  const pathname = trimmed.split("?")[0].split("#")[0];
  if (BLOCKED_PATHS.has(pathname) || pathname.startsWith("/api/")) {
    return null;
  }

  return trimmed;
}

export function storeAuthRedirectTarget(
  target: string | null | undefined,
): void {
  if (typeof window === "undefined") return;

  const normalized = sanitizeAuthRedirectTarget(target);
  if (!normalized) return;

  window.sessionStorage.setItem(AUTH_REDIRECT_STORAGE_KEY, normalized);
}

export function readAuthRedirectTarget(): string | null {
  if (typeof window === "undefined") return null;

  return sanitizeAuthRedirectTarget(
    window.sessionStorage.getItem(AUTH_REDIRECT_STORAGE_KEY),
  );
}

export function clearAuthRedirectTarget(): void {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(AUTH_REDIRECT_STORAGE_KEY);
}

export function resolveAuthRedirectTarget(
  searchParams?: SearchParamsLike | null,
  fallback = DEFAULT_AUTH_REDIRECT,
): string {
  const queryTarget = sanitizeAuthRedirectTarget(searchParams?.get("next"));
  return queryTarget ?? readAuthRedirectTarget() ?? fallback;
}

export function buildAuthCallbackUrl(nextTarget?: string | null): string {
  if (typeof window === "undefined") {
    return "/auth-callback";
  }

  const url = new URL("/auth-callback", window.location.origin);
  const normalized = sanitizeAuthRedirectTarget(nextTarget);
  if (normalized) {
    url.searchParams.set("next", normalized);
  }
  return url.toString();
}

export function buildRedirectUrl(targetPath: string): string {
  if (typeof window === "undefined") return targetPath;
  return new URL(targetPath, window.location.origin).toString();
}

export function buildAuthLinkHref(
  path: string,
  nextTarget?: string | null,
): string {
  const normalized = sanitizeAuthRedirectTarget(nextTarget);
  if (!normalized) return path;

  const separator = path.includes("?") ? "&" : "?";
  return `${path}${separator}next=${encodeURIComponent(normalized)}`;
}
