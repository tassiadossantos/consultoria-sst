import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchCompaniesMock = vi.hoisted(() => vi.fn());
const fetchPgrsMock = vi.hoisted(() => vi.fn());
const fetchExpiringTrainingsMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  fetchCompanies: fetchCompaniesMock,
  fetchPgrs: fetchPgrsMock,
  fetchExpiringTrainings: fetchExpiringTrainingsMock,
}));

import HelpPage from "./help";

function renderPage(path = "/ajuda") {
  window.history.pushState({}, "", path);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HelpPage />
    </QueryClientProvider>,
  );
}

describe("Help page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders essential static sections", async () => {
    renderPage();

    expect(await screen.findByText("Central de Ajuda")).toBeInTheDocument();
    expect(screen.getByText("Primeiros Passos (5 minutos)")).toBeInTheDocument();
    expect(screen.queryByText("Atalhos Inteligentes")).not.toBeInTheDocument();
    expect(screen.queryByText("Diagnóstico Rápido")).not.toBeInTheDocument();
    expect(screen.getByText("FAQ por Módulo")).toBeInTheDocument();
    expect(screen.getAllByText("Guia Normativo TST").length).toBeGreaterThan(0);
    expect(screen.queryByText("Quando algo falhar")).not.toBeInTheDocument();
    expect(screen.queryByText("Atualizações Oficiais SST (MTE)")).not.toBeInTheDocument();
  }, 10000);

  it("supports topic query param", async () => {
    renderPage("/ajuda?topico=faq");

    expect(await screen.findByText("Topico: FAQ")).toBeInTheDocument();
    expect(screen.queryByText("Atalhos Inteligentes")).not.toBeInTheDocument();
  });

  it("opens faq item and displays the selected answer", async () => {
    renderPage();

    const trigger = await screen.findByRole("button", {
      name: /Dashboard:?\s*O card mostra alerta, mas a lista não bate/i,
    });

    fireEvent.click(trigger);

    expect(
      await screen.findByText(/cálculo é feito pelo backend com janela de 7 dias/i),
    ).toBeInTheDocument();
  });

  it("renders complete TST guide when topic is guia-tst", async () => {
    renderPage("/ajuda?topico=guia-tst");

    expect(await screen.findByText("Topico: Guia TST")).toBeInTheDocument();
    expect(screen.getByText("Guia Completo de Atuação do Técnico de Segurança do Trabalho")).toBeInTheDocument();
    expect(screen.getByText("Documentos que o TST Autônomo Pode Assinar")).toBeInTheDocument();
    expect(screen.getByText("Resumo Visual por Grau de Autonomia do TST")).toBeInTheDocument();
    expect(screen.getByText("PGR (geral)")).toBeInTheDocument();
    expect(screen.getByText("Laudo de Insalubridade")).toBeInTheDocument();
  }, 10000);

  it("opens complete guide when clicking Abrir guia completo", async () => {
    renderPage("/ajuda");

    fireEvent.click(await screen.findByRole("button", { name: "Abrir guia completo" }));

    expect(await screen.findByText("Topico: Guia TST")).toBeInTheDocument();
    expect(screen.getByText("Guia Completo de Atuação do Técnico de Segurança do Trabalho")).toBeInTheDocument();
  }, 10000);
});
