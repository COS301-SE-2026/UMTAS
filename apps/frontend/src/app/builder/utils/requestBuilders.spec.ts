import { getAllModulesBuilder } from "./requestBuilders";
import { getModulesByIdBuilder } from "./requestBuilders";
const apiUrl = process.env.API_URL || "http://localhost:3000";

describe("getAllModulesBuilder", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ modules: [] }),
    });
  });

  it("should hit the /modules endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name === "content-type" ? "application/json" : null,
      },
      json: async () => ({ modules: [] }),
    });

    const builder = new getAllModulesBuilder();
    await builder.send({});
    console.log("Fetch called with:", (global.fetch as jest.Mock).mock.calls);

    expect(global.fetch).toHaveBeenCalledWith(
      apiUrl + "/modules",
      expect.objectContaining({ method: "GET" }),
    );
  });
});

describe("getModulesByIdBuilder", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name === "content-type" ? "application/json" : null,
      },
      json: async () => ({ module: { id: "123" } }),
    });
  });

  it("should correctly hit the parameter listed endpoint", async () => {
    const builder = new getModulesByIdBuilder();

    await builder.send({ paths: { moduleId: 123 } });
    console.log("Fetch called with:", (global.fetch as jest.Mock).mock.calls);

    expect(global.fetch).toHaveBeenCalledWith(
      apiUrl + "/modules/123",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
