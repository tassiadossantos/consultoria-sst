import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listPgrsMock = vi.hoisted(() => vi.fn());
const deletePgrMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/pgr", () => ({
  listPgrs: listPgrsMock,
  deletePgr: deletePgrMock,
}));

import PGRList from "./pgr-list";

function renderPage(path: string) {
  window.history.pushState({}, "", path);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <PGRList />
    </QueryClientProvider>,
  );
}

describe("PGRList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    deletePgrMock.mockResolvedValue(undefined);
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

    expect(await screen.findByText("Metalúrgica Aço Forte Ltda")).toBeInTheDocument();
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

    await screen.findByText("Metalúrgica Aço Forte Ltda");

    fireEvent.click(screen.getByRole("button", { name: "Excluir PGR" }));
    fireEvent.click(await screen.findByRole("button", { name: "Excluir" }));

    await waitFor(() => {
      expect(deletePgrMock).toHaveBeenCalled();
      expect(deletePgrMock.mock.calls[0]?.[0]).toBe("pgr-1");
    });
  });
});
