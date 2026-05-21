import {
  createModulesBuilder,
  getAllModulesBuilder,
  getModulesByIdBuilder,
  updateModulesBuilder,
  deleteModulesById,
  createModuleReq,
  updateModuleByIdBody,
  updateModuleByIdPath,
  deleteModulesByIdPath,
} from "./requestBuilders";

const apiUrl =
  (typeof window === "undefined"
    ? process.env.API_URL
    : process.env.NEXT_PUBLIC_API_URL) || "http://localhost:3000";

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

describe("createModulesBuilder", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: {
        get: (name: string) =>
          name === "content-type" ? "application/json" : null,
      },
      json: async () => ({ module: {} }),
    });
  });

  it("should hit the /modules endpoint with POST", async () => {
    const builder = new createModulesBuilder();
    const mockBody: createModuleReq = {
      name: "New Module",
      code: "CS101",
    };
    await builder.send({ body: mockBody });

    expect(global.fetch).toHaveBeenCalledWith(
      apiUrl + "/modules",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(mockBody),
      }),
    );
  });
});

describe("updateModulesBuilder", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name === "content-type" ? "application/json" : null,
      },
      json: async () => ({ module: {} }),
    });
  });

  it("should hit the /modules/{moduleId} endpoint with PATCH", async () => {
    const builder = new updateModulesBuilder();
    const mockPath: updateModuleByIdPath = { moduleId: 123 };
    const mockBody: updateModuleByIdBody = { name: "Updated Module" };
    await builder.send({
      paths: mockPath,
      body: mockBody,
    });

    expect(global.fetch).toHaveBeenCalledWith(
      apiUrl + "/modules/123",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify(mockBody),
      }),
    );
  });
});

describe("deleteModulesById", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: {
        get: (name: string) =>
          name === "content-type" ? "application/json" : null,
      },
      json: async () => ({}),
    });
  });

  it("should hit the /modules/{moduleId} endpoint with DELETE", async () => {
    const builder = new deleteModulesById();
    const mockPath: deleteModulesByIdPath = { moduleId: 123 };
    await builder.send({ paths: mockPath });

    expect(global.fetch).toHaveBeenCalledWith(
      apiUrl + "/modules/123",
      expect.objectContaining({
        method: "DELETE",
      }),
    );
  });
});
