import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const fetchPgrsMock = vi.hoisted(() => vi.fn());
const fetchCompaniesMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  fetchPgrs: fetchPgrsMock,
  fetchCompanies: fetchCompaniesMock,
}));

import Dashboard from "./dashboard";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>,
  );
}

afterEach(() => {
  vi.useRealTimers();
});

describe("Dashboard page", () => {
  const now = new Date();
  const currentMonthDateA = new Date(now.getFullYear(), now.getMonth(), 10).toISOString();
  const currentMonthDateB = new Date(now.getFullYear(), now.getMonth(), 15).toISOString();
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 10).toISOString();
  const expiredValidUntil = new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const pgrsFixture = [
    {
      id: "pgr-1",
      status: "active",
      revision: 2,
      valid_until: "2030-12-31",
      created_at: currentMonthDateA,
      progress: 100,
      company: { id: "c1", name: "Metalúrgica Aço Forte Ltda", cnpj: "12.345.678/0001-90" },
    },
    {
      id: "pgr-2",
      status: "active",
      revision: 1,
      valid_until: "2030-11-20",
      created_at: currentMonthDateB,
      progress: 100,
      company: { id: "c2", name: "Comercial Delta", cnpj: "11.111.111/0001-11" },
    },
    {
      id: "pgr-3",
      status: "active",
      revision: 1,
      valid_until: "2030-06-20",
      created_at: previousMonthDate,
      progress: 90,
      company: { id: "c3", name: "Logística Alfa", cnpj: "22.222.222/0001-22" },
    },
    {
      id: "pgr-4",
      status: "expired",
      revision: 1,
      valid_until: expiredValidUntil,
      created_at: previousMonthDate,
      progress: 65,
      company: { id: "c2", name: "Comercial Delta", cnpj: "11.111.111/0001-11" },
    },
    {
      id: "pgr-5",
      status: "draft",
      revision: 0,
      valid_until: null,
      created_at: currentMonthDateB,
      progress: 20,
      company: { id: "c4", name: "Oficina Mecânica Rápida", cnpj: "33.333.333/0001-33" },
    },
  ];

  const companiesFixture = [
    { id: "c1" },
    { id: "c2" },
    { id: "c3" },
    { id: "c4" },
  ];

  it("renders overview and key metrics", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);

    renderPage();

    expect(await screen.findByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("PGRs Ativos")).toBeInTheDocument();
    expect(screen.getByText("Documentos Vencidos")).toBeInTheDocument();
    expect(screen.getByText("Total Empresas")).toBeInTheDocument();
    expect(screen.getByText("+1 desde o último mês")).toBeInTheDocument();
    expect(screen.getByText("1 vencido há mais de 30 dias")).toBeInTheDocument();
    expect(screen.getByText("1 rascunho pendente")).toBeInTheDocument();
    expect(screen.getByText("4 empresas com PGR monitorado")).toBeInTheDocument();
  });

  it("renders recent pgr list", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    expect(await screen.findByText("PGRs Recentes")).toBeInTheDocument();
    expect(await screen.findByText("Metalúrgica Aço Forte Ltda")).toBeInTheDocument();
  });

  it("links recent PGR cards to preview or edit routes", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const metalurgicaLink = (await screen.findByText("Metalúrgica Aço Forte Ltda")).closest("a");
    const oficinaLink = (await screen.findByText("Oficina Mecânica Rápida")).closest("a");

    expect(metalurgicaLink).toHaveAttribute("href", "/pgr/pgr-1/preview");
    expect(oficinaLink).toHaveAttribute("href", "/pgr/pgr-5/editar");
  });

  it("navigates to trainings when clicking Verificar", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const verifyButton = await screen.findByRole("button", { name: "Verificar" });
    const verifyLink = verifyButton.closest("a");

    expect(verifyLink).toHaveAttribute(
      "href",
      "/treinamentos?busca=Metalúrgica%20Aço%20Forte%20NR-35",
    );
  });

  it("navigates to normative update when clicking Ler nota técnica", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const noteLink = await screen.findByRole("link", { name: "Ler nota técnica" });

    expect(noteLink).toHaveAttribute("href", "/atualizacao-normativa");
  });

  it("navigates to active PGRs when clicking PGRs Ativos card", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const activeCardLink = (await screen.findByText("PGRs Ativos")).closest("a");

    expect(activeCardLink).toHaveAttribute("href", "/pgr?status=active");
  });

  it("navigates to expired PGRs when clicking Documentos Vencidos card", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const expiredCardLink = (await screen.findByText("Documentos Vencidos")).closest("a");

    expect(expiredCardLink).toHaveAttribute("href", "/pgr?status=expired");
  });

  it("navigates to draft PGRs when clicking Em Elaboração card", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const draftCardLink = (await screen.findByText("Em Elaboração")).closest("a");

    expect(draftCardLink).toHaveAttribute("href", "/pgr?status=draft");
  });

  it("navigates to PGR list when clicking Total Empresas card", async () => {
    fetchPgrsMock.mockResolvedValue(pgrsFixture);
    fetchCompaniesMock.mockResolvedValue(companiesFixture);
    renderPage();

    const companiesCardLink = (await screen.findByText("Total Empresas")).closest("a");

    expect(companiesCardLink).toHaveAttribute("href", "/pgr");
  });
});
