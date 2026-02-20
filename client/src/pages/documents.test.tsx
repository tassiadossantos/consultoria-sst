import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Documents from "./documents";

describe("Documents page", () => {
  it("renders page heading and description", () => {
    render(<Documents />);

    expect(screen.getByText("Documentos Derivados")).toBeInTheDocument();
    expect(
      screen.getByText("Emissão de documentos complementares ao PGR (NR-01)."),
    ).toBeInTheDocument();
  });

  it("renders known document templates", () => {
    render(<Documents />);

    expect(screen.getByText("Obrigatórios GRO / NR-1")).toBeInTheDocument();
    expect(screen.getByText("Operacionais e Gestão")).toBeInTheDocument();
    expect(screen.getByText("Não Emitidos Pelo TST (somente informativo)")).toBeInTheDocument();

    expect(screen.getByText("Ordem de Serviço de Segurança (OSS)")).toBeInTheDocument();
    expect(screen.getByText("APR - Análise Preliminar de Risco")).toBeInTheDocument();
    expect(screen.getByText("Ficha de EPI (NR-06)")).toBeInTheDocument();
    expect(screen.getByText("POP - Procedimento Operacional")).toBeInTheDocument();
    expect(screen.getByText("CAT - Comunicação de Acidente de Trabalho")).toBeInTheDocument();
    expect(screen.getByText("Laudo de Insalubridade")).toBeInTheDocument();

    expect(screen.getAllByText("Base normativa").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Gerar documento").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Somente referência").length).toBeGreaterThan(0);
  });

  it("navigates to generator page from Gerar documento links", () => {
    render(<Documents />);

    const links = screen.getAllByRole("link", { name: "Gerar documento" });

    expect(links.length).toBeGreaterThan(0);
    expect(links[0]).toHaveAttribute("href");
    expect(links[0].getAttribute("href")).toContain("/documentos/novo?tipo=");
  });
});
