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

  public async send(body?: RequestType): Promise<ResponseType> {
    if (this.method !== RequestMethod.GET && body === undefined) {
      console.error("The Body must be provided for non GET requests");
      throw new Error(
        "500 Internal Server Error: Request body required for non GET method",
      );
    }

    const response = await fetch(this.url, {
      method: this.method,
      headers: this.headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // returns the json instead of the promise
    return (await response.json()) as ResponseType;
  }
}

interface HealthCheckRequest {
  exampleString: string;
}
interface HealthCheckResponse {
  status: string;
  uptime?: number;
}

export class HealthCheck extends RequestBuilder<
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

// Example usage
async function exampleUsage() {
  const response = await new HealthCheck().send();
  console.log("Health status:", response.status, "Uptime:", response.uptime);
}

// can either have frontend making functions like these or just using the builders
