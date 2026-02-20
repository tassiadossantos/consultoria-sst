import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listPgrsMock = vi.hoisted(() => vi.fn());
const deletePgrMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/pgr", () => ({
  listPgrs: listPgrsMock,
  deletePgr: deletePgrMock,
}));

import PGRList from "./pgr-list";
import { Router } from "wouter";

function renderPage(path: string) {
  window.history.pushState({}, "", path);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <Router>
      <QueryClientProvider client={queryClient}>
        <PGRList />
      </QueryClientProvider>
    </Router>,
  );
}

describe("PGRList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deletePgrMock.mockResolvedValue(undefined);
  });

  it("shows error when API fails", async () => {
    listPgrsMock.mockRejectedValue(new Error("Falha de rede"));
    renderPage("/pgr");
    expect(await screen.findByText(/Falha ao carregar PGRs/i)).toBeInTheDocument();
  });

  it("renders PGRs with missing company or status", async () => {
    listPgrsMock.mockResolvedValue([
      { id: "pgr-1", status: undefined, company: null, revision: 1, valid_until: null, created_at: "2024-01-15", progress: 100 },
    ]);
    renderPage("/pgr");
    expect(await screen.findByText(/Empresa não informada/i)).toBeInTheDocument();
    expect(screen.getByText(/Rascunho/i)).toBeInTheDocument();
  });

  it("navigates to edit PGR", async () => {
    listPgrsMock.mockResolvedValue([
      { id: "pgr-1", status: "draft", company: { id: "1", name: "Empresa Editar" }, revision: 0, valid_until: null, created_at: "2024-01-15", progress: 35 },
    ]);
    renderPage("/pgr");
    const companyCell = await screen.findByText("Empresa Editar");
    const row = companyCell.closest("tr");
    expect(row).not.toBeNull();
    const editButton = within(row as HTMLElement).getByTitle("Editar PGR");
    const editLink = editButton.closest("a");
    expect(editLink).toHaveAttribute("href", "/pgr/pgr-1/editar");

    const previewButton = within(row as HTMLElement).getByTitle("Visualizar PDF");
    const previewLink = previewButton.closest("a");
    expect(previewLink).toHaveAttribute("href", "/pgr/pgr-1/preview");

    const printButton = within(row as HTMLElement).getByTitle("Imprimir PDF");
    const printLink = printButton.closest("a");
    expect(printLink).toHaveAttribute("href", "/pgr/pgr-1/preview?print=1");
  });

  it("filters by nonexistent status and shows empty", async () => {
    listPgrsMock.mockResolvedValue([
        { id: "pgr-1", status: "active", company: {id: "1", name: "Empresa"}, revision: 1, valid_until: null, created_at: "2024-01-15", progress: 100 },
    ]);
    renderPage("/pgr?status=draft");
    expect(await screen.findByText(/Nenhum resultado encontrado/i)).toBeInTheDocument();
  });

  it("shows PGRs returned by the API filtered by active status", async () => {
    listPgrsMock.mockResolvedValue([
      {
        id: "pgr-1",
        status: "active",
        revision: 1,
        valid_until: "2026-01-15",
        created_at: "2024-01-15",
        progress: 100,
        company: { id: "1", name: "Metalúrgica Aço Forte Ltda", cnpj: "12.345.678/0001-90" },
      },
      {
        id: "pgr-2",
        status: "draft",
        revision: 0,
        valid_until: null,
        created_at: "2024-05-20",
        progress: 35,
        company: { id: "5", name: "Oficina Mecânica Rápida", cnpj: null },
      },
    ]);

    renderPage("/pgr?status=active");

    await screen.findByText("Metalúrgica Aço Forte Ltda");
    expect(screen.queryByText("Oficina Mecânica Rápida")).not.toBeInTheDocument();
  });

  it("shows empty state when API returns no data", async () => {
    listPgrsMock.mockResolvedValue([]);

    renderPage("/pgr");

    expect(
      await screen.findByText('Nenhum PGR cadastrado ainda. Clique em "Novo PGR" para iniciar.'),
    ).toBeInTheDocument();
  });

  it("deletes a PGR after confirmation", async () => {
    listPgrsMock.mockResolvedValue([
      {
        id: "pgr-1",
        status: "active",
        revision: 1,
        valid_until: "2026-01-15",
        created_at: "2024-01-15",
        progress: 100,
        company: { id: "1", name: "Metalúrgica Aço Forte Ltda", cnpj: "12.345.678/0001-90" },
      },
    ]);

    renderPage("/pgr");

    const companyCell = await screen.findByText("Metalúrgica Aço Forte Ltda");
    const row = companyCell.closest("tr");
    expect(row).not.toBeNull();

    fireEvent.click(within(row as HTMLElement).getByTitle("Excluir PGR"));
    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(deletePgrMock).toHaveBeenCalled();
      expect(deletePgrMock.mock.calls[0]?.[0]).toBe("pgr-1");
    });
  }, 10000);
});
