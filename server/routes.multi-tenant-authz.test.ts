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

function validTrainingPayload() {
  return {
    title: "NR-35 - Reciclagem da equipe",
    training_date: "2028-01-10",
    instructor: "Tassia dos Santos Silva",
    participants_count: 3,
    participants_label: "Ana Souza, Bruno Lima, Carla Santos",
    status: "agendado",
    company_id: null,
    notes: "NR: NR-35 | Carga horária: 8h | Data da realização: 2026-01-10 | Validade: 24 meses",
  };
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

  it("forwards orphan company cleanup flag when deleting PGR", async () => {
    storageMock.deletePgr.mockResolvedValue(true);

    const response = await fetch(
      apiUrl(baseUrl, "/api/pgrs/pgr-1?delete_orphan_company=1"),
      {
        method: "DELETE",
        headers: {
          "x-tenant-id": "tenant-a",
          "x-role": "admin",
        },
      },
    );

    expect(response.status).toBe(204);
    expect(storageMock.deletePgr).toHaveBeenCalledWith(
      "tenant-a",
      "pgr-1",
      { deleteOrphanCompany: true },
    );
  });

  it("rejects invalid training payload when NR metadata is missing", async () => {
    const response = await fetch(apiUrl(baseUrl, "/api/trainings"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
        "x-role": "admin",
      },
      body: JSON.stringify({
        ...validTrainingPayload(),
        notes: null,
      }),
    });

    expect(response.status).toBe(400);
    expect(storageMock.createTraining).not.toHaveBeenCalled();
  });

  it("accepts valid training payload with NR metadata", async () => {
    storageMock.createTraining.mockResolvedValue({
      id: "training-1",
      tenant_id: "tenant-a",
      ...validTrainingPayload(),
      created_at: "2026-02-19T12:00:00.000Z",
      updated_at: null,
    });

    const response = await fetch(apiUrl(baseUrl, "/api/trainings"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
        "x-role": "admin",
      },
      body: JSON.stringify(validTrainingPayload()),
    });

    expect(response.status).toBe(201);
    expect(storageMock.createTraining).toHaveBeenCalledWith(
      "tenant-a",
      expect.objectContaining(validTrainingPayload()),
    );
  });

  it("rejects update when NR catalog rules become invalid", async () => {
    storageMock.getTraining.mockResolvedValue({
      id: "training-1",
      tenant_id: "tenant-a",
      ...validTrainingPayload(),
      created_at: "2026-02-19T12:00:00.000Z",
      updated_at: null,
    });

    const response = await fetch(apiUrl(baseUrl, "/api/trainings/training-1"), {
      method: "PUT",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
        "x-role": "admin",
      },
      body: JSON.stringify({
        title: "Treinamento sem NR",
      }),
    });

    expect(response.status).toBe(400);
    expect(storageMock.updateTraining).not.toHaveBeenCalled();
  });

  it("returns 409 when creating company with duplicated CNPJ", async () => {
    storageMock.createCompany.mockRejectedValue({ code: "23505" });

    const response = await fetch(apiUrl(baseUrl, "/api/companies"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
        "x-role": "admin",
      },
      body: JSON.stringify({
        name: "Empresa Duplicada",
        cnpj: "12.345.678/0001-90",
        risk_level: 3,
        employees: 10,
      }),
    });

    expect(response.status).toBe(409);
    expect(storageMock.createCompany).toHaveBeenCalledWith(
      "tenant-a",
      expect.objectContaining({
        name: "Empresa Duplicada",
        cnpj: "12.345.678/0001-90",
      }),
    );
  });
});
