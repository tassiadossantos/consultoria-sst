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

    expect(screen.getByText("Ordem de Serviço (NR-01)")).toBeInTheDocument();
    expect(screen.getByText("APR - Análise Preliminar")).toBeInTheDocument();
    expect(screen.getByText("Ficha de EPI (NR-06)")).toBeInTheDocument();
    expect(screen.getByText("POP - Procedimento Operacional")).toBeInTheDocument();
  });
});
