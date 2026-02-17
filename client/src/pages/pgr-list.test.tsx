import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const isSupabaseConfiguredMock = vi.hoisted(() => vi.fn());
const listPgrsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
}));

vi.mock("@/lib/pgr", () => ({
  listPgrs: listPgrsMock,
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
    listPgrsMock.mockResolvedValue([]);
  });

  it("shows only active mock PGRs when opened with status=active and no Supabase", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    renderPage("/pgr?status=active");

    expect(await screen.findByText("Metalúrgica Aço Forte Ltda")).toBeInTheDocument();
    expect(screen.getByText("Padaria Pão Quente")).toBeInTheDocument();
    expect(screen.queryByText("Oficina Mecânica Rápida")).not.toBeInTheDocument();
  });

  it("falls back to mock PGRs when Supabase is configured but has no rows", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);

    renderPage("/pgr?status=active");

    expect(await screen.findByText("Metalúrgica Aço Forte Ltda")).toBeInTheDocument();
    expect(screen.getByText("Padaria Pão Quente")).toBeInTheDocument();
    expect(screen.queryByText("Oficina Mecânica Rápida")).not.toBeInTheDocument();
  });
});
