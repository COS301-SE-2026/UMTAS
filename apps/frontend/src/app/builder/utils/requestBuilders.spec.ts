import { getAllModulesBuilder } from "./requestBuilders";
const apiUrl = process.env.API_URL || "http://localhost:300";

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

    expect(global.fetch).toHaveBeenCalledWith(
      apiUrl + "/modules",
      expect.objectContaining({ method: "GET" }),
    );
  });
});
