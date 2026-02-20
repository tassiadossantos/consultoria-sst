// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { DocumentPdfPayload, PgrDetail } from "@shared/schema";
import { generateDocumentPdf, generatePgrPdf } from "./pdf";

function createFixture(overrides?: Partial<PgrDetail["pgr"]>): PgrDetail {
  return {
    pgr: {
      id: "pgr-1",
      tenant_id: "tenant-1",
      company_id: "company-1",
      status: "active",
      revision: 3,
      valid_until: "2027-10-01",
      created_at: "2026-02-01T12:00:00.000Z",
      updated_at: null,
      characterization: "Caracterizacao da empresa",
      responsibilities: "Responsabilidades do PGR",
      risk_criteria: "Criterios de avaliacao",
      control_measures: "Medidas de controle",
      training_plan: "Plano de treinamentos",
      monitoring: "Plano de monitoramento",
      responsible_name: "Tecnico Teste",
      responsible_registry: "12345",
      progress: 100,
      ...overrides,
    },
    company: {
      id: "company-1",
      tenant_id: "tenant-1",
      name: "Empresa Teste",
      trade_name: null,
      cnpj: "12.345.678/0001-90",
      cnae: null,
      address: "Rua Teste, 100",
      employees: 20,
      risk_level: 2,
      legal_responsible: null,
      created_at: "2026-01-01T00:00:00.000Z",
    },
    risks: [],
    actions: [],
  };
}

describe("generatePgrPdf", () => {
  it("generates a valid PDF buffer", () => {
    const pdf = generatePgrPdf(createFixture(), {
      documentId: "pgr-1",
      tenantId: "tenant-1",
      userId: "user-1",
      generatedAt: new Date("2026-02-19T15:30:00.000Z"),
    });

    const text = pdf.toString("binary");
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("/Type /Pages");
    expect(text).toContain("startxref");
  });

  it("creates multiple pages when content exceeds one page", () => {
    const longText = "linha ".repeat(12000);
    const pdf = generatePgrPdf(
      createFixture({
        characterization: longText,
        responsibilities: longText,
      }),
      {
        documentId: "pgr-2",
        tenantId: "tenant-1",
        userId: "user-1",
        generatedAt: new Date("2026-02-19T15:30:00.000Z"),
      },
    );

    const text = pdf.toString("binary");
    const countMatch = text.match(/\/Count (\d+)/);
    expect(countMatch).not.toBeNull();
    expect(Number(countMatch?.[1] ?? 1)).toBeGreaterThan(1);
  });
});

describe("generateDocumentPdf", () => {
  function createDocumentPayload(overrides?: Partial<DocumentPdfPayload>): DocumentPdfPayload {
    return {
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
      technical_content: "Riscos, controles e medidas preventivas",
      recommendations: "Revisar toda semana",
      responsible_name: "Tecnico Teste",
      responsible_registry: "00.1234/SP",
      company_representative: "Gestor",
      issue_date: "2026-02-19",
      ...overrides,
    };
  }

  it("generates a valid PDF buffer for generated documents", () => {
    const pdf = generateDocumentPdf(createDocumentPayload(), {
      templateId: "apr",
      tenantId: "tenant-1",
      userId: "user-1",
      generatedAt: new Date("2026-02-19T15:30:00.000Z"),
    });

    const text = pdf.toString("binary");
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(text.startsWith("%PDF-1.4")).toBe(true);
    expect(text).toContain("/Type /Catalog");
    expect(text).toContain("/Type /Pages");
    expect(text).toContain("startxref");
  });

  it("creates multiple pages when generated content is long", () => {
    const longText = "conteudo tecnico ".repeat(10000);
    const pdf = generateDocumentPdf(
      createDocumentPayload({
        technical_content: longText,
        recommendations: longText,
      }),
      {
        templateId: "apr",
        tenantId: "tenant-1",
        userId: "user-1",
        generatedAt: new Date("2026-02-19T15:30:00.000Z"),
      },
    );

    const text = pdf.toString("binary");
    const countMatch = text.match(/\/Count (\d+)/);
    expect(countMatch).not.toBeNull();
    expect(Number(countMatch?.[1] ?? 1)).toBeGreaterThan(1);
  });
});
