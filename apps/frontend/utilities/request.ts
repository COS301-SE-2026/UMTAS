import { paths } from "../src/lib/api";

// url is something like /universities
export function createBaseURL(): string {
  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

  const cleanBase = baseUrl.replace(/\/$/, "");
  const apiBase = cleanBase.includes("/api") ? cleanBase : `${cleanBase}/api`;

  return `${apiBase}/`;
}

export function createUrl(url: string): string {
  const cleanPath = url.replace(/^\//, "");
  return `${createBaseURL()}${cleanPath}`;
}

export function cleanBase() {
  const baseUrl =
    (typeof window === "undefined"
      ? process.env.API_URL
      : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";
  return baseUrl.replace(/\/$/, "");
}

type SwaggerPathKeys = Extract<keyof paths, string>;
export type ApiPath = SwaggerPathKeys extends `/api${infer Rest}`
  ? Rest
  : SwaggerPathKeys;

enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}
export type intTest<
  PathType = undefined,
  RequestType = undefined,
  ResponseType = undefined,
> = {
  tName: string;
  args: {
    paths?: PathType;
    body?: RequestType;
  };
  expectedResponse?: ResponseType;
};

export class RequestBuilder<
  PathType = undefined,
  RequestType = undefined,
  ResponseType = undefined,
> {
  private url: string = "";
  private method: RequestMethod = RequestMethod.GET;
  private arrTests: intTest<PathType, RequestType, ResponseType>[] = [];
  private headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  protected setUrl(url: ApiPath): this {
    this.url = createUrl(url);

    if (this.url.includes("/api/api")) {
    }
    if (typeof window === "undefined") {
      // Automatically set Origin header in Node.js environments for CORS/CSRF
      this.headers["Origin"] = cleanBase();
    }

    return this;
  }

  protected setMethod(method: RequestMethod): this {
    this.method = method;
    return this;
  }

  public setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  protected setBearerToken(token: string): this {
    this.headers["Authorization"] = `Bearer ${token}`;
    return this;
  }
  public async testSignIn() {
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:3000";
    const testEmail = process.env.SEED_SYSTEM_ADMIN_EMAIL;
    const testPassword = process.env.SEED_SYSTEM_ADMIN_PASSWORD;

    if (!testEmail || !testPassword) {
      console.warn("TEST_USER_EMAIL or TEST_USER_PASSWORD not set");
      return;
    }

    const response = await fetch(`${createUrl("/auth/sign-in/email")}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: apiUrl,
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Login failed with status ${response.status}: ${errorBody}`,
      );
    }

    const cookies = response.headers.getSetCookie();
    const sessionCookie = cookies.map((c) => c.split(";")[0]).join("; ");

    if (sessionCookie) this.setHeaders({ Cookie: sessionCookie });
  }

  public addIntegrationTest(
    test: intTest<PathType, RequestType, ResponseType>,
  ): this {
    this.arrTests.push(test);
    return this;
  }
  public runTests(suiteTestName: string): void {
    describe(suiteTestName, () => {
      this.arrTests.forEach((test) => {
        it(test.tName, async () => {
          if (test.expectedResponse == undefined) {
            await expect(this.send(test.args)).resolves.toBeDefined();
          } else {
            const response = await this.send(test.args);
            expect(response).toEqual(test.expectedResponse);
          }
        });
      });
    });
  }

  public async send(args: {
    paths?: PathType;
    body?: RequestType;
  }): Promise<ResponseType> {
    const { paths, body } = args;
    const methodsRequiringBody: RequestMethod[] = [
      RequestMethod.POST,
      RequestMethod.PUT,
      RequestMethod.PATCH,
    ];

    if (methodsRequiringBody.includes(this.method) && body === undefined) {
      throw new Error(`Request body required for ${this.method} requests`);
    }

    let finalUrl = this.url;

    if (paths) {
      Object.entries(paths as Record<string, string>).forEach(
        ([key, value]) => {
          finalUrl = finalUrl.split(`{${key}}`).join(String(value));
          finalUrl = finalUrl.split(`:${key}`).join(String(value));
        },
      );
    }

    const response = await fetch(finalUrl, {
      method: this.method,
      headers: this.headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      let errorBody = "";
      try {
        errorBody = await response.text();
      } catch {
        errorBody = "(could not read response body)";
      }
      throw new Error(`HTTP ${response.status}: ${errorBody}`);
    }

    const contentType = response.headers.get("content-type");
    if (
      response.status === 204 ||
      response.headers.get("content-length") === "0" ||
      !contentType ||
      !contentType.includes("application/json")
    ) {
      return {} as ResponseType;
    }

    return (await response.json()) as ResponseType;
  }
}

export { RequestMethod };
