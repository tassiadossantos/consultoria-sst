import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/layout", () => ({
  Layout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

import DocumentGeneratorPage from "./document-generator";

function renderPage(path: string) {
  window.history.pushState({}, "", path);
  return render(<DocumentGeneratorPage />);
}

describe("DocumentGeneratorPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders wizard-like form for a valid document type", () => {
    renderPage("/documentos/novo?tipo=apr");

    expect(screen.getByText("Novo Documento")).toBeInTheDocument();
    expect(screen.getByText(/APR - Análise Preliminar de Risco/i)).toBeInTheDocument();
    expect(screen.getByText("1. Identificação da empresa")).toBeInTheDocument();
    expect(screen.getByText("2. Conteúdo técnico")).toBeInTheDocument();
    expect(screen.getByText("3. Responsáveis e assinatura")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Emitir documento" })).toBeInTheDocument();
  });

  it("shows error message for invalid document type", () => {
    renderPage("/documentos/novo?tipo=documento-invalido");

    expect(screen.getByText("Tipo de documento inválido")).toBeInTheDocument();
    expect(
      screen.getByText("Selecione um documento válido pela tela de Documentos para iniciar o preenchimento."),
    ).toBeInTheDocument();
  });
});
