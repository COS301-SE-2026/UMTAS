const CHECK_IN_PATH = "/attendance/check-in";

export interface ParsedNfcTagUrl {
  tagId: string;
  token: string;
}

export function buildNfcTagUrl(
  tagId: string,
  token: string,
  origin?: string,
): string {
  const baseOrigin =
    origin ??
    (typeof window === "undefined"
      ? "https://umtas.example"
      : window.location.origin);
  const url = new URL(CHECK_IN_PATH, baseOrigin);
  url.searchParams.set("tagId", tagId);
  url.searchParams.set("token", token);
  return url.toString();
}

export function parseNfcTagUrl(
  input: string,
  expectedOrigin?: string,
): ParsedNfcTagUrl | null {
  try {
    const url = new URL(input);
    if (url.pathname !== CHECK_IN_PATH) return null;
    const origin =
      expectedOrigin ??
      (typeof window === "undefined" ? undefined : window.location.origin);
    if (origin && url.origin !== origin) return null;

    const tagId = url.searchParams.get("tagId")?.trim();
    const token = url.searchParams.get("token")?.trim();

    if (!tagId || !token || tagId.length < 6 || token.length < 8) {
      return null;
    }

    return { tagId, token };
  } catch {
    return null;
  }
}

export function isNfcTagUrl(input: string): boolean {
  return parseNfcTagUrl(input) !== null;
}
