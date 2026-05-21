import {
  buildAuthLinkHref,
  clearAuthRedirectTarget,
  readAuthRedirectTarget,
  resolveAuthRedirectTarget,
  sanitizeAuthRedirectTarget,
  storeAuthRedirectTarget,
} from "./auth-redirect";

describe("auth redirect helper", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps only safe internal targets", () => {
    expect(sanitizeAuthRedirectTarget("/dashboard")).toBe("/dashboard");
    expect(sanitizeAuthRedirectTarget("/dashboard?tab=1")).toBe(
      "/dashboard?tab=1",
    );
    expect(sanitizeAuthRedirectTarget("https://example.com")).toBeNull();
    expect(sanitizeAuthRedirectTarget("//example.com")).toBeNull();
    expect(sanitizeAuthRedirectTarget("/login")).toBeNull();
    expect(sanitizeAuthRedirectTarget("/api/auth/session")).toBeNull();
  });

  it("reads a stored redirect target when no query param is present", () => {
    storeAuthRedirectTarget("/timetable");
    expect(readAuthRedirectTarget()).toBe("/timetable");
    expect(resolveAuthRedirectTarget()).toBe("/timetable");
  });

  it("clears a stored redirect target", () => {
    storeAuthRedirectTarget("/timetable");
    clearAuthRedirectTarget();
    expect(readAuthRedirectTarget()).toBeNull();
  });

  it("builds auth links that preserve a safe next target", () => {
    expect(buildAuthLinkHref("/login", "/builder")).toBe(
      "/login?next=%2Fbuilder",
    );
    expect(buildAuthLinkHref("/register?mode=guest", "/builder")).toBe(
      "/register?mode=guest&next=%2Fbuilder",
    );
    expect(buildAuthLinkHref("/login", "/login")).toBe("/login");
  });
});
