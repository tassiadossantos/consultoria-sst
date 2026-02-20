import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentPdfPayload } from "@shared/schema";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("./queryClient", () => ({
  apiRequest: apiRequestMock,
}));

import { generateDocumentPdf } from "./api";

function createPayload(): DocumentPdfPayload {
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
    technical_content: "Riscos e medidas de controle",
    recommendations: "Acompanhar semanalmente",
    responsible_name: "Tecnico Teste",
    responsible_registry: "00.1234/SP",
    company_representative: "Gestor",
    issue_date: "2026-02-19",
  };
}

describe("api – document pdf generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts payload to /api/documents/pdf and returns blob + parsed filename", async () => {
    const blob = new Blob(["pdf-bytes"], { type: "application/pdf" });
    apiRequestMock.mockResolvedValue({
      blob: () => Promise.resolve(blob),
      headers: {
        get: () => 'attachment; filename="documento-apr-2026-02-19.pdf"',
      },
    });

    const result = await generateDocumentPdf(createPayload());

    expect(apiRequestMock).toHaveBeenCalledWith("POST", "/api/documents/pdf", expect.any(Object));
    expect(result.blob).toEqual(blob);
    expect(result.filename).toBe("documento-apr-2026-02-19.pdf");
  });

  it("uses fallback filename when content-disposition is missing", async () => {
    const blob = new Blob(["pdf-bytes"], { type: "application/pdf" });
    apiRequestMock.mockResolvedValue({
      blob: () => Promise.resolve(blob),
      headers: {
        get: () => null,
      },
    });

    const result = await generateDocumentPdf(createPayload());

    expect(result.filename).toBe("documento-apr.pdf");
  });
});
