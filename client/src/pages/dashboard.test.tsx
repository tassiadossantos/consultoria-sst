import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Dashboard from "./dashboard";

describe("Dashboard page", () => {
  it("renders overview and key metrics", () => {
    render(<Dashboard />);

    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("PGRs Ativos")).toBeInTheDocument();
    expect(screen.getByText("Documentos Vencidos")).toBeInTheDocument();
    expect(screen.getByText("Total Empresas")).toBeInTheDocument();
  });

  it("renders recent pgr list", () => {
    render(<Dashboard />);

    expect(screen.getByText("PGRs Recentes")).toBeInTheDocument();
    expect(screen.getByText("Metalúrgica Aço Forte Ltda")).toBeInTheDocument();
  });
});
