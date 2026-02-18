import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Companies from "./companies";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Companies />
    </QueryClientProvider>,
  );
}

describe("Companies page", () => {
  it("renders page header and new company button", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: "Empresas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova Empresa" })).toBeInTheDocument();
  });

  it("opens new company dialog on click", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Nova Empresa" }));

    expect(screen.getByRole("heading", { name: "Nova Empresa" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Metalúrgica Exemplo Ltda")).toBeInTheDocument();
  });
});
