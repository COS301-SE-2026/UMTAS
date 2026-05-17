enum RequestMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

export class RequestBuilder<RequestType, ResponseType> {
  private url: string = "";
  private method: RequestMethod = RequestMethod.GET;
  private headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  public setUrl(url: string): this {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    this.url = `${baseUrl}/${url.replace(/^\//, "")}`;
    return this;
  }

  public setMethod(method: RequestMethod): this {
    this.method = method;
    return this;
  }

  public setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  public setBearerToken(token: string): this {
    this.headers["Authorization"] = `Bearer ${token}`;
    return this;
  }

  public async send(body?: RequestType): Promise<ResponseType> {
    const response = await fetch(this.url, {
      method: this.method,
      headers: this.headers,
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return (await response.json()) as ResponseType;
  }
}

export { RequestMethod };
