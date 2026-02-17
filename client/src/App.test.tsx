import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/pages/dashboard", () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock("@/pages/pgr-list", () => ({
  default: () => <div>PGR List Page</div>,
}));

vi.mock("@/pages/companies", () => ({
  default: () => <div>Companies Page</div>,
}));

vi.mock("@/pages/pgr-wizard", () => ({
  default: () => <div>PGR Wizard Page</div>,
}));

vi.mock("@/pages/document-preview", () => ({
  default: () => <div>Document Preview Page</div>,
}));

vi.mock("@/pages/trainings", () => ({
  default: () => <div>Trainings Page</div>,
}));

vi.mock("@/pages/documents", () => ({
  default: () => <div>Documents Page</div>,
}));

vi.mock("@/pages/normative-update", () => ({
  default: () => <div>Normative Update Page</div>,
}));

vi.mock("@/pages/not-found", () => ({
  default: () => <div>Not Found Page</div>,
}));

vi.mock("@/components/ui/toaster", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

import App from "./App";

const setPath = (path: string) => {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
};

describe("App routes", () => {
  it("renders dashboard on root route", () => {
    setPath("/");
    render(<App />);

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  it("renders pgr list route", () => {
    setPath("/pgr");
    render(<App />);

    expect(screen.getByText("PGR List Page")).toBeInTheDocument();
  });

  it("renders companies route", () => {
    setPath("/empresas");
    render(<App />);

    expect(screen.getByText("Companies Page")).toBeInTheDocument();
  });

  it("renders pgr wizard create route", () => {
    setPath("/pgr/novo");
    render(<App />);

    expect(screen.getByText("PGR Wizard Page")).toBeInTheDocument();
  });

  it("renders pgr wizard edit route", () => {
    setPath("/pgr/123/editar");
    render(<App />);

    expect(screen.getByText("PGR Wizard Page")).toBeInTheDocument();
  });

  it("renders document preview route", () => {
    setPath("/pgr/123/preview");
    render(<App />);

    expect(screen.getByText("Document Preview Page")).toBeInTheDocument();
  });

  it("renders trainings route", () => {
    setPath("/treinamentos");
    render(<App />);

    expect(screen.getByText("Trainings Page")).toBeInTheDocument();
  });

  it("renders documents route", () => {
    setPath("/documentos");
    render(<App />);

    expect(screen.getByText("Documents Page")).toBeInTheDocument();
  });

  it("renders normative update route", () => {
    setPath("/atualizacao-normativa");
    render(<App />);

    expect(screen.getByText("Normative Update Page")).toBeInTheDocument();
  });

  it("renders fallback route for unknown paths", () => {
    setPath("/rota-inexistente");
    render(<App />);

    expect(screen.getByText("Not Found Page")).toBeInTheDocument();
  });
});
