import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import Dashboard from "./dashboard";

afterEach(() => {
  vi.useRealTimers();
});

describe("Dashboard page", () => {
  it("renders overview and key metrics", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-20T10:00:00.000Z"));

    render(<Dashboard />);

    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("PGRs Ativos")).toBeInTheDocument();
    expect(screen.getByText("Documentos Vencidos")).toBeInTheDocument();
    expect(screen.getByText("Total Empresas")).toBeInTheDocument();
    expect(screen.getByText("+1 desde o último mês")).toBeInTheDocument();
    expect(screen.getByText("1 vencido há mais de 30 dias")).toBeInTheDocument();
    expect(screen.getByText("1 rascunho pendente")).toBeInTheDocument();
    expect(screen.getByText("4 empresas com PGR monitorado")).toBeInTheDocument();
  });

  it("renders recent pgr list", () => {
    render(<Dashboard />);

    expect(screen.getByText("PGRs Recentes")).toBeInTheDocument();
    expect(screen.getByText("Metalúrgica Aço Forte Ltda")).toBeInTheDocument();
  });

  it("links recent PGR cards to preview or edit routes", () => {
    render(<Dashboard />);

    const metalurgicaLink = screen
      .getByText("Metalúrgica Aço Forte Ltda")
      .closest("a");
    const oficinaLink = screen.getByText("Oficina Mecânica Rápida").closest("a");

    expect(metalurgicaLink).toHaveAttribute("href", "/pgr/pgr-1/preview");
    expect(oficinaLink).toHaveAttribute("href", "/pgr/pgr-4/editar");
  });

  it("navigates to trainings when clicking Verificar", () => {
    render(<Dashboard />);

    const verifyLink = screen.getByRole("link", { name: "Verificar" });

    expect(verifyLink).toHaveAttribute(
      "href",
      "/treinamentos?busca=Metalúrgica%20Aço%20Forte%20NR-35",
    );
  });

  it("navigates to normative update when clicking Ler nota técnica", () => {
    render(<Dashboard />);

    const noteLink = screen.getByRole("link", { name: "Ler nota técnica" });

    expect(noteLink).toHaveAttribute("href", "/atualizacao-normativa");
  });

  it("navigates to active PGRs when clicking PGRs Ativos card", () => {
    render(<Dashboard />);

    const activeCardLink = screen.getByText("PGRs Ativos").closest("a");

    expect(activeCardLink).toHaveAttribute("href", "/pgr?status=active");
  });

  it("navigates to expired PGRs when clicking Documentos Vencidos card", () => {
    render(<Dashboard />);

    const expiredCardLink = screen.getByText("Documentos Vencidos").closest("a");

    expect(expiredCardLink).toHaveAttribute("href", "/pgr?status=expired");
  });

  it("navigates to draft PGRs when clicking Em Elaboração card", () => {
    render(<Dashboard />);

    const draftCardLink = screen.getByText("Em Elaboração").closest("a");

    expect(draftCardLink).toHaveAttribute("href", "/pgr?status=draft");
  });

  it("navigates to PGR list when clicking Total Empresas card", () => {
    render(<Dashboard />);

    const companiesCardLink = screen.getByText("Total Empresas").closest("a");

    expect(companiesCardLink).toHaveAttribute("href", "/pgr");
  });
});
