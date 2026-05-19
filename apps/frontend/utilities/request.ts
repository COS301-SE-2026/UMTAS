enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export class RequestBuilder<RequestType, ResponseType, PathType = undefined> {
  private url: string = "";
  private method: RequestMethod = RequestMethod.GET;
  private headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  protected setUrl(url: string): this {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const cleanBase = baseUrl.replace(/\/$/, "");
    const cleanPath = url.replace(/^\//, "");
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

  public async send(body?: RequestType): Promise<ResponseType> {
    const methodsRequiringBody: RequestMethod[] = [
      RequestMethod.POST,
      RequestMethod.PUT,
    ];

    if (methodsRequiringBody.includes(this.method) && body === undefined) {
      throw new Error(`Request body required for ${this.method} requests`);
    }

    let finalUrl = this.url;

    if (this.method === RequestMethod.GET && body !== undefined) {
      const params = new URLSearchParams();
      Object.entries(body as Record<string, string | number | boolean>).forEach(
        ([key, value]) => {
          params.append(key, String(value));
        },
      );
      finalUrl += `?${params.toString()}`;
    }

    const response = await fetch(finalUrl, {
      method: this.method,
      headers: this.headers,
      credentials: "include",
      body:
        this.method !== RequestMethod.GET && body !== undefined
          ? JSON.stringify(body)
          : undefined,
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
