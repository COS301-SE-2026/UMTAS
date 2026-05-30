import { paths } from "../src/lib/api";

enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}
export type intTest<PathType, RequestType> = {
  tName: string;
  args: {
    paths?: PathType;
    body?: RequestType;
  };
};

export class RequestBuilder<
  PathType = undefined,
  RequestType = undefined,
  ResponseType = undefined,
> {
  private url: string = "";
  private method: RequestMethod = RequestMethod.GET;
  private arrTests: intTest<PathType, RequestType>[] = [];
  private headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  protected setUrl(url: keyof paths): this {
    const baseUrl =
      (typeof window === "undefined"
        ? process.env.API_URL
        : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanPath = (url as string).replace(/^\//, "");
    this.url = `${cleanBase}/${cleanPath}`;

    // Automatically set Origin header in Node.js environments for CORS/CSRF
    if (typeof window === "undefined") {
      this.headers["Origin"] = cleanBase;
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

  protected addIntegrationTest(test: intTest<PathType, RequestType>): this {
    this.arrTests.push(test);
    return this;
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
