import { paths } from "../src/lib/api";

enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
  PATCH = "PATCH",
}

export class RequestBuilder<
  PathType = undefined,
  RequestType = undefined,
  ResponseType = undefined,
> {
  private url: string = "";
  private method: RequestMethod = RequestMethod.GET;
  private headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  protected setUrl(url: keyof paths): this {
    const baseUrl = process.env.API_URL || "http://localhost:3000";
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanPath = (url as string).replace(/^\//, "");
    this.url = `${cleanBase}/${cleanPath}`;
    return this;
  }

  protected setMethod(method: RequestMethod): this {
    this.method = method;
    return this;
  }

  protected setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  protected setBearerToken(token: string): this {
    this.headers["Authorization"] = `Bearer ${token}`;
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
