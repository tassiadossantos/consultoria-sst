// @vitest-environment node
import express, { type NextFunction, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const storageMock = vi.hoisted(() => ({
  getSettings: vi.fn(),
  updateSettings: vi.fn(),
  listCompanies: vi.fn(),
  getCompany: vi.fn(),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  deleteCompany: vi.fn(),
  listPgrs: vi.fn(),
  getPgrDetail: vi.fn(),
  createPgr: vi.fn(),
  updatePgr: vi.fn(),
  deletePgr: vi.fn(),
  listTrainings: vi.fn(),
  getTraining: vi.fn(),
  createTraining: vi.fn(),
  updateTraining: vi.fn(),
  deleteTraining: vi.fn(),
}));

const authMock = vi.hoisted(() => ({
  registerAuthRoutes: vi.fn(),
  requireAuth: vi.fn(),
}));

vi.mock("./storage", () => ({
  storage: storageMock,
}));

vi.mock("./auth", () => ({
  registerAuthRoutes: authMock.registerAuthRoutes,
  requireAuth: authMock.requireAuth,
}));

import { registerRoutes } from "./routes";

function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

describe("multi-tenant authorization", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    server = createServer(app);
    await registerRoutes(app, server);

    await new Promise<void>((resolve, reject) => {
      server.listen(0, "127.0.0.1", () => resolve());
      server.on("error", reject);
    });

    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Failed to bind HTTP server for tests");
    }
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    authMock.registerAuthRoutes.mockResolvedValue(undefined);
    authMock.requireAuth.mockImplementation(
      (req: Request, _res: Response, next: NextFunction) => {
        const tenantHeader = req.headers["x-tenant-id"];
        if (typeof tenantHeader === "string" && tenantHeader.length > 0) {
          req.authTenantId = tenantHeader;
        }

        const roleHeader = req.headers["x-role"];
        req.authRole = typeof roleHeader === "string" ? roleHeader : "admin";
        req.authUserId = "user-test";
        req.authUsername = "tester";
        next();
      },
    );
  });

  it("returns 404 for cross-tenant company access", async () => {
    storageMock.getCompany.mockResolvedValue(undefined);

    const response = await fetch(apiUrl(baseUrl, "/api/companies/company-b"), {
      method: "GET",
      headers: {
        "x-tenant-id": "tenant-a",
        "x-role": "admin",
      },
    });

    expect(response.status).toBe(404);
    expect(storageMock.getCompany).toHaveBeenCalledWith("tenant-a", "company-b");
  });

  it("returns 404 for cross-tenant company update", async () => {
    storageMock.updateCompany.mockResolvedValue(undefined);

    const response = await fetch(apiUrl(baseUrl, "/api/companies/company-b"), {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
        "x-role": "admin",
      },
      body: JSON.stringify({ name: "Empresa X" }),
    });

    expect(response.status).toBe(404);
    expect(storageMock.updateCompany).toHaveBeenCalledWith(
      "tenant-a",
      "company-b",
      expect.objectContaining({ name: "Empresa X" }),
    );
  });

  it("returns 403 when non-admin tenant accesses settings", async () => {
    const response = await fetch(apiUrl(baseUrl, "/api/settings"), {
      method: "GET",
      headers: {
        "x-tenant-id": "tenant-a",
        "x-role": "user",
      },
    });

    expect(response.status).toBe(403);
    expect(storageMock.getSettings).not.toHaveBeenCalled();
  });
});
