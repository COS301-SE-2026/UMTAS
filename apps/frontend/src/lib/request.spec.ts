import { createBaseURL, createUrl } from "../../utilities/request";

describe("API URL construction", () => {
  const originalApiUrl = process.env.NEXT_PUBLIC_API_URL;

  afterEach(() => {
    if (originalApiUrl === undefined) {
      delete process.env.NEXT_PUBLIC_API_URL;
    } else {
      process.env.NEXT_PUBLIC_API_URL = originalApiUrl;
    }
  });

  it("adds the API path when api is only part of the hostname", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

    expect(createBaseURL()).toBe("https://api.example.com/api/");
    expect(createUrl("/academic-calendar/generate")).toBe(
      "https://api.example.com/api/academic-calendar/generate",
    );
  });

  it("does not duplicate an existing API path", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://example.com/api/";

    expect(createBaseURL()).toBe("https://example.com/api/");
  });

  it("supports a same-origin relative base", () => {
    process.env.NEXT_PUBLIC_API_URL = "/api";

    expect(createBaseURL()).toBe("/api/");
    expect(createUrl("/academic-calendar/generate")).toBe(
      "/api/academic-calendar/generate",
    );
  });

  it("adds the API path to a relative base that lacks it", () => {
    process.env.NEXT_PUBLIC_API_URL = "/backend/";

    expect(createBaseURL()).toBe("/backend/api/");
  });
});
