import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getPgrDetailMock = vi.hoisted(() => vi.fn());
const isSupabaseConfiguredMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/pgr", () => ({
  getPgrDetail: getPgrDetailMock,
}));

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
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

  return render(
    <QueryClientProvider client={queryClient}>
      <DocumentPreview />
    </QueryClientProvider>,
  );
}

describe("DocumentPreview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isSupabaseConfiguredMock.mockReturnValue(true);
  });

  it("falls back to mock data when fetch fails for a known mock PGR id", async () => {
    getPgrDetailMock.mockRejectedValue(new Error("not found"));

    renderPreview("/pgr/pgr-1/preview");

    await waitFor(() => {
      expect(getPgrDetailMock).toHaveBeenCalledWith("pgr-1");
    });

    expect(
      await screen.findByText("PGR - Programa de Gerenciamento de Riscos"),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Metalúrgica Aço Forte Ltda").length).toBeGreaterThan(0);
    expect(screen.queryByText("Falha ao carregar o PGR")).not.toBeInTheDocument();
  });

  it("shows supabase warning when not configured and no mock matches", () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    renderPreview("/pgr/id-inexistente/preview");

    expect(screen.getByText("Supabase não configurado")).toBeInTheDocument();
  });
});
