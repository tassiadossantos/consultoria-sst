import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPgrDetailMock = vi.hoisted(() => vi.fn());
const downloadPgrPdfMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/pgr", () => ({
  getPgrDetail: getPgrDetailMock,
  downloadPgrPdf: downloadPgrPdfMock,
}));

import DocumentPreview from "./document-preview";

function renderPreview(path: string) {
  window.history.pushState({}, "", path);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const { unmount } = render(
    <QueryClientProvider client={queryClient}>
      <DocumentPreview />
    </QueryClientProvider>,
  );

  return { unmount };
}

const fixture = {
  pgr: {
    id: "pgr-1",
    company_id: "1",
    status: "active",
    revision: 2,
    valid_until: "2026-01-15",
    created_at: "2024-01-15",
    updated_at: null,
    characterization: "Caracterização teste",
    responsibilities: "Responsabilidades",
    risk_criteria: "Critérios",
    control_measures: "Medidas",
    training_plan: "Treinamento",
    monitoring: "Monitoramento",
    responsible_name: "Técnico Teste",
    responsible_registry: "00.1234/SP",
    progress: 100,
  },
  company: {
    id: "1",
    name: "Metalúrgica Aço Forte Ltda",
    trade_name: null,
    cnpj: "12.345.678/0001-90",
    cnae: null,
    address: "Rua Teste, 100",
    employees: 45,
    risk_level: 3,
    legal_responsible: null,
    created_at: "2024-01-15",
  },
  risks: [],
  actions: [],
};

describe("DocumentPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows error when API fails", async () => {
    getPgrDetailMock.mockRejectedValue(new Error("Falha de rede"));
    renderPreview("/pgr/pgr-erro/preview");
    expect(await screen.findByText(/Falha ao carregar o PGR/i)).toBeInTheDocument();
  });

  it("renders document with missing fields", async () => {
    getPgrDetailMock.mockResolvedValue({
      pgr: { ...fixture.pgr, responsibilities: undefined },
      company: fixture.company,
    });
    renderPreview("/pgr/pgr-1/preview");

    const identificationSection = await screen.findByRole("region", { name: /Identificação da Empresa/i });
    expect(within(identificationSection).getByText(/Metalúrgica Aço Forte Ltda/i)).toBeInTheDocument();
    
    const responsibilitiesSection = await screen.findByRole("region", { name: /Responsabilidades/i });
    expect(within(responsibilitiesSection).getByText(/Não informado/i)).toBeInTheDocument();
  });

  it("renders without crashing for draft and expired documents", async () => {
    getPgrDetailMock.mockResolvedValue({ pgr: { ...fixture.pgr, status: "draft" }, company: fixture.company });
    const { unmount } = renderPreview("/pgr/pgr-1/preview");
    expect(await screen.findByText("PGR - Programa de Gerenciamento de Riscos")).toBeInTheDocument();
    unmount(); // Clean up before next render

    getPgrDetailMock.mockResolvedValue({ pgr: { ...fixture.pgr, status: "expired" }, company: fixture.company });
    renderPreview("/pgr/pgr-1/preview");
    expect(await screen.findByText("PGR - Programa de Gerenciamento de Riscos")).toBeInTheDocument();
  });

  it("renders PGR document when API returns data", async () => {
    getPgrDetailMock.mockResolvedValue(fixture);

    renderPreview("/pgr/pgr-1/preview");

    await waitFor(() => {
      expect(getPgrDetailMock).toHaveBeenCalledWith("pgr-1");
    });

    expect(
      await screen.findByText("PGR - Programa de Gerenciamento de Riscos"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Metalúrgica Aço Forte Ltda").length).toBeGreaterThan(0);
  });

  it("shows error when API call fails", async () => {
    getPgrDetailMock.mockRejectedValue(new Error("not found"));

    renderPreview("/pgr/id-inexistente/preview");

    expect(await screen.findByText("Falha ao carregar o PGR")).toBeInTheDocument();
  });
});
