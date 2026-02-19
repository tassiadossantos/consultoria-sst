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

const pdfServiceMock = vi.hoisted(() => ({
  generatePgrPdf: vi.fn(),
}));

vi.mock("./storage", () => ({
  storage: storageMock,
}));

vi.mock("./auth", () => ({
  registerAuthRoutes: authMock.registerAuthRoutes,
  requireAuth: authMock.requireAuth,
}));

vi.mock("./services/pdf", () => ({
  generatePgrPdf: pdfServiceMock.generatePgrPdf,
}));

import { registerRoutes } from "./routes";

function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

describe("PGR PDF route", () => {
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
        req.authTenantId = typeof tenantHeader === "string" ? tenantHeader : "tenant-a";
        req.authRole = "admin";
        req.authUserId = "user-test";
        req.authUsername = "tester";
        next();
      },
    );
  });

  it("returns 404 when PGR does not exist in tenant scope", async () => {
    storageMock.getPgrDetail.mockResolvedValue(undefined);

    const response = await fetch(apiUrl(baseUrl, "/api/pgrs/pgr-nao-existe/pdf"), {
      method: "GET",
      headers: {
        "x-tenant-id": "tenant-a",
      },
    });

    expect(response.status).toBe(404);
    expect(storageMock.getPgrDetail).toHaveBeenCalledWith("tenant-a", "pgr-nao-existe");
    expect(pdfServiceMock.generatePgrPdf).not.toHaveBeenCalled();
  });

  it("returns application/pdf with attachment when PGR exists", async () => {
    storageMock.getPgrDetail.mockResolvedValue({
      pgr: {
        id: "pgr-1",
        tenant_id: "tenant-a",
        company_id: "company-1",
        status: "active",
        revision: 1,
        valid_until: null,
        created_at: "2026-02-19T12:00:00.000Z",
        updated_at: null,
        characterization: null,
        responsibilities: null,
        risk_criteria: null,
        control_measures: null,
        training_plan: null,
        monitoring: null,
        responsible_name: null,
        responsible_registry: null,
        progress: 0,
      },
      company: null,
      risks: [],
      actions: [],
    });

    const pdfBytes = Buffer.from("%PDF-1.4\nmock", "binary");
    pdfServiceMock.generatePgrPdf.mockReturnValue(pdfBytes);

    const response = await fetch(apiUrl(baseUrl, "/api/pgrs/pgr-1/pdf"), {
      method: "GET",
      headers: {
        "x-tenant-id": "tenant-a",
      },
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("content-disposition")).toContain("pgr-pgr-1.pdf");
    expect(pdfServiceMock.generatePgrPdf).toHaveBeenCalledTimes(1);

    const body = await response.arrayBuffer();
    expect(Buffer.from(body).equals(pdfBytes)).toBe(true);
  });
});
