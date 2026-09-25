import { testNfcTag } from "./nfc_api";
import { testRegisteredTagUrl } from "./register_tag";

jest.mock("./nfc_api", () => ({
  confirmTagRegistration: jest.fn(),
  prepareTagRegistration: jest.fn(),
  testNfcTag: jest.fn(),
}));

const mockedTestNfcTag = jest.mocked(testNfcTag);

describe("testRegisteredTagUrl", () => {
  beforeEach(() => jest.clearAllMocks());

  it("validates the credential read from a registered NFC tag", async () => {
    mockedTestNfcTag.mockResolvedValue({
      valid: true,
      message: "Tag read successfully. No attendance was recorded.",
      displayId: "…ABC123",
    });

    await expect(
      testRegisteredTagUrl(
        `${window.location.origin}/attendance/check-in?tagId=tag-123&token=secret-token&source=nfc`,
      ),
    ).resolves.toEqual({
      valid: true,
      message: "Tag read successfully. No attendance was recorded.",
      displayId: "…ABC123",
    });
    expect(mockedTestNfcTag).toHaveBeenCalledWith({
      tagId: "tag-123",
      token: "secret-token",
    });
  });

  it("rejects unrelated NFC content without calling the API", async () => {
    await expect(
      testRegisteredTagUrl("https://example.com/not-an-attendance-tag"),
    ).resolves.toEqual({
      valid: false,
      message: "This sticker does not contain a valid UMTAS attendance link.",
    });
    expect(mockedTestNfcTag).not.toHaveBeenCalled();
  });
});
