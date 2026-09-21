import { buildNfcTagUrl, parseNfcTagUrl } from "./tag_url";

describe("NFC tag URLs", () => {
  it("builds and parses a reusable attendance URL", () => {
    const url = buildNfcTagUrl(
      "tag-123456",
      "secret-123456789",
      "https://umtas.test",
    );
    expect(url).toBe(
      "https://umtas.test/attendance/check-in?tagId=tag-123456&token=secret-123456789",
    );
    expect(parseNfcTagUrl(url, "https://umtas.test")).toEqual({
      tagId: "tag-123456",
      token: "secret-123456789",
    });
  });

  it("rejects URLs outside the check-in route", () => {
    expect(
      parseNfcTagUrl(
        "https://umtas.test/dashboard?tagId=tag-123456&token=secret-123456789",
      ),
    ).toBeNull();
  });

  it("rejects check-in paths from another origin", () => {
    expect(
      parseNfcTagUrl(
        "https://attacker.test/attendance/check-in?tagId=tag-123456&token=secret-123456789",
        "https://umtas.test",
      ),
    ).toBeNull();
  });
});
