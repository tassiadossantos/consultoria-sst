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
  generateDocumentPdf: vi.fn(),
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
  generateDocumentPdf: pdfServiceMock.generateDocumentPdf,
}));

import { registerRoutes } from "./routes";

function apiUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

describe("Document PDF route", () => {
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

  it("returns 400 when payload is invalid", async () => {
    const response = await fetch(apiUrl(baseUrl, "/api/documents/pdf"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
      },
      body: JSON.stringify({}),
    });

    expect(response.status).toBe(400);
    expect(pdfServiceMock.generateDocumentPdf).not.toHaveBeenCalled();
  });

  it("returns application/pdf attachment when payload is valid", async () => {
    const pdfBytes = Buffer.from("%PDF-1.4\nmock", "binary");
    pdfServiceMock.generateDocumentPdf.mockReturnValue(pdfBytes);

    const response = await fetch(apiUrl(baseUrl, "/api/documents/pdf"), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-tenant-id": "tenant-a",
      },
      body: JSON.stringify({
        template_id: "apr",
        template_title: "APR - Análise Preliminar de Risco",
        normative_base: "NR 12, NR 18, NR 20, NR 33 e NR 35",
        signature_status: "sim",
        company_name: "Empresa Teste",
        cnpj: "12.345.678/0001-90",
        address: "Rua Teste, 100",
        sector: "Manutencao",
        objective: "Avaliar riscos da atividade",
        scope: "Equipe de manutencao",
        technical_content: "Riscos, medidas e controles",
        recommendations: "Acompanhar semanalmente",
        responsible_name: "Tecnico Teste",
        responsible_registry: "00.1234/SP",
        company_representative: "Gestor da Empresa",
        issue_date: "2026-02-19",
      }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("application/pdf");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("content-disposition")).toContain("documento-apr-");
    expect(pdfServiceMock.generateDocumentPdf).toHaveBeenCalledTimes(1);
    expect(pdfServiceMock.generateDocumentPdf).toHaveBeenCalledWith(
      expect.objectContaining({
        template_id: "apr",
        template_title: "APR - Análise Preliminar de Risco",
        company_name: "Empresa Teste",
      }),
      expect.objectContaining({
        templateId: "apr",
        tenantId: "tenant-a",
        userId: "user-test",
      }),
    );

    const body = await response.arrayBuffer();
    expect(Buffer.from(body).equals(pdfBytes)).toBe(true);
  });
});
