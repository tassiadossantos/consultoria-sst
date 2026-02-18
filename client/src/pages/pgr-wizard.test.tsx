import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createPgrMock = vi.hoisted(() => vi.fn());
const updatePgrMock = vi.hoisted(() => vi.fn());
const getPgrDetailMock = vi.hoisted(() => vi.fn());
const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/components/layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/lib/pgr", () => ({
  createPgr: createPgrMock,
  updatePgr: updatePgrMock,
  getPgrDetail: getPgrDetailMock,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

import PGRWizard from "./pgr-wizard";

function renderWizard(path = "/pgr/novo") {
  window.history.pushState({}, "", path);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PGRWizard />
    </QueryClientProvider>,
  );
}

const editFixture = {
  pgr: {
    id: "pgr-456",
    company_id: "company-123",
    status: "draft",
    revision: 1,
    valid_until: "2026-12-31",
    created_at: "2026-01-01",
    updated_at: "2026-01-02",
    characterization: "Objetivo: Reduzir riscos\n\nCaracterização inicial",
    responsibilities: "Responsabilidades definidas",
    risk_criteria: "Matriz 5x5",
    control_measures: "Medidas vigentes",
    training_plan: "Plano de treinamento",
    monitoring: "Monitoramento trimestral",
    responsible_name: "Resp. Técnico",
    responsible_registry: "00.9999/SP",
    progress: 60,
  },
  company: {
    id: "company-123",
    name: "Empresa Beta",
    trade_name: "Beta",
    cnpj: "11.111.111/0001-11",
    cnae: "25.11-0-00",
    address: "Rua Teste, 100",
    employees: 10,
    risk_level: 3,
    legal_responsible: "Fulano",
    created_at: "2026-01-01",
  },
  risks: [
    {
      id: "risk-1",
      pgr_id: "pgr-456",
      sector: "Produção",
      role: "Operador",
      activity: "Operar máquina",
      hazard: "Ruído",
      risk: "Perda auditiva",
      risk_type: "fisico",
      probability: 3,
      severity: 3,
      risk_score: 9,
      risk_level: "Médio",
      controls: "Protetor auricular",
      epi: "Auricular",
    },
  ],
  actions: [
    {
      id: "action-1",
      pgr_id: "pgr-456",
      action: "Inspecionar EPC",
      owner: "Supervisor",
      due_date: "2026-03-10",
      status: "PENDENTE",
    },
  ],
};

describe("PGRWizard integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createPgrMock.mockResolvedValue("pgr-123");
    updatePgrMock.mockResolvedValue("pgr-123");
    getPgrDetailMock.mockResolvedValue(null);
  });

  it("fills required steps and submits an active PGR", async () => {
    renderWizard();

    fireEvent.change(screen.getByPlaceholderText("Ex: Metalúrgica Exemplo Ltda"), {
      target: { value: "Empresa Alfa" },
    });
    fireEvent.change(screen.getByPlaceholderText("00.000.000/0001-00"), {
      target: { value: "12.345.678/0001-90" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));

    fireEvent.click(screen.getByRole("button", { name: /Adicionar Risco/i }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar Risco/i }));

    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    fireEvent.change(
      screen.getByPlaceholderText(
        "Defina probabilidade, gravidade e matriz de risco utilizada.",
      ),
      { target: { value: "Matriz 5x5" } },
    );

    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    fireEvent.change(
      screen.getByPlaceholderText(/Descreva medidas coletivas/i),
      { target: { value: "EPC, EPC e treinamento" } },
    );

    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    fireEvent.change(screen.getByPlaceholderText("Ex: Instalar exaustores"), {
      target: { value: "Instalar proteção de máquina" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Adicionar Ação/i }));

    fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    fireEvent.change(
      screen.getByPlaceholderText(
        "Revisão anual obrigatória, revisão imediata em caso de acidentes ou mudanças no processo.",
      ),
      { target: { value: "Revisão anual" } },
    );
    fireEvent.change(
      screen.getByPlaceholderText("Nome do Técnico de Segurança"),
      { target: { value: "Tassia dos Santos" } },
    );
    fireEvent.change(screen.getByPlaceholderText("Ex: 00.1234/SP"), {
      target: { value: "00.1234/SP" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Finalizar/i }));

    await waitFor(() => {
      expect(createPgrMock).toHaveBeenCalledTimes(1);
    });

    const payload = createPgrMock.mock.calls[0][0];
    expect(payload.pgr.status).toBe("active");
    expect(payload.risks).toHaveLength(1);
    expect(payload.actions).toHaveLength(1);
    expect(payload.company.name).toBe("Empresa Alfa");

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "PGR criado" }),
    );
  }, 10000);

  it("blocks active submit when required data is missing", async () => {
    renderWizard();

    for (let step = 1; step < 6; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /Próximo/i }));
    }

    fireEvent.click(screen.getByRole("button", { name: /Finalizar/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Preencha os campos obrigatorios" }),
      );
    });

    expect(createPgrMock).not.toHaveBeenCalled();
  });

  it("hydrates fields when opening edit route", async () => {
    getPgrDetailMock.mockResolvedValue(editFixture);

    renderWizard("/pgr/pgr-456/editar");

    await waitFor(() => {
      expect(getPgrDetailMock).toHaveBeenCalledWith("pgr-456");
    });

    expect(screen.getByText("Editar PGR (NR-01)")).toBeInTheDocument();
    expect(await screen.findByDisplayValue("Empresa Beta")).toBeInTheDocument();
    expect(screen.getByDisplayValue("11.111.111/0001-11")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Reduzir riscos")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Responsabilidades definidas")).toBeInTheDocument();
  });

  it("submits updatePgr in edit mode when saving draft", async () => {
    getPgrDetailMock.mockResolvedValue(editFixture);

    renderWizard("/pgr/pgr-456/editar");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Empresa Beta")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText("Ex: Metalúrgica Exemplo Ltda"), {
      target: { value: "Empresa Beta Atualizada" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar Alteracoes/i }));

    await waitFor(() => {
      expect(updatePgrMock).toHaveBeenCalledTimes(1);
    });

    expect(createPgrMock).not.toHaveBeenCalled();

    const payload = updatePgrMock.mock.calls[0][0];
    expect(payload.pgrId).toBe("pgr-456");
    expect(payload.companyId).toBe("company-123");
    expect(payload.pgr.status).toBe("draft");
    expect(payload.company.name).toBe("Empresa Beta Atualizada");

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Rascunho salvo" }),
    );
  });

  it("shows error alert when getPgrDetail fails in edit mode", async () => {
    getPgrDetailMock.mockRejectedValue(new Error("Falha de rede"));

    renderWizard("/pgr/pgr-erro/editar");

    expect(await screen.findByText("Falha ao carregar PGR")).toBeInTheDocument();
    expect(
      screen.getByText("Verifique a conexão com o servidor e tente novamente."),
    ).toBeInTheDocument();
  });

  it("blocks update when hydrated payload has no companyId", async () => {
    getPgrDetailMock.mockResolvedValue({
      ...editFixture,
      company: null,
    });

    renderWizard("/pgr/pgr-456/editar");

    await waitFor(() => {
      expect(getPgrDetailMock).toHaveBeenCalledWith("pgr-456");
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar Alteracoes/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Empresa não encontrada" }),
      );
    });

    expect(updatePgrMock).not.toHaveBeenCalled();
    expect(createPgrMock).not.toHaveBeenCalled();
  });

  it("shows error toast when updatePgr mutation rejects", async () => {
    getPgrDetailMock.mockResolvedValue(editFixture);
    updatePgrMock.mockRejectedValue(new Error("falha update"));

    renderWizard("/pgr/pgr-456/editar");

    await waitFor(() => {
      expect(screen.getByDisplayValue("Empresa Beta")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Salvar Alteracoes/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Erro ao salvar" }),
      );
    });
  });
});
