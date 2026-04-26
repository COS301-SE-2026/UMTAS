// requestBuilder.ts

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
  private body?: RequestType;

  public setUrl(url: string): this {
    // change this to use the env base url
    const baseUrl = "placeholderVeryWrong/";
    this.url = baseUrl + url;
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

  public setBody(body: RequestType): this {
    this.body = body;
    return this;
  }

  public async send(): Promise<ResponseType> {
    const response = await fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body ? JSON.stringify(this.body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    return (await response.json()) as ResponseType;
  }
}

interface HealthCheckRequest {}

interface HealthCheckResponse {
  status: string;
  uptime?: number;
}

export class HealthCheckRequestBuilder extends RequestBuilder<
  HealthCheckRequest,
  HealthCheckResponse
> {
  constructor() {
    super();
    this.setUrl(`/health`)
      .setMethod(RequestMethod.GET)
      .setBearerToken("Bearer_Example");
  }
}

function exampleUsage() {
  async function checkHealth() {
    const builder = new HealthCheckRequestBuilder();

    const response = await builder.send();

    console.log("Health status:", response.status, "Uptime:", response.uptime);
  }
}
