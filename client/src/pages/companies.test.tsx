import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Companies from "./companies";

describe("Companies page", () => {
  it("renders page header and new company button", () => {
    render(<Companies />);

    expect(screen.getByRole("heading", { name: "Empresas" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nova Empresa" })).toBeInTheDocument();
  });

  it("opens new company dialog on click", () => {
    render(<Companies />);

    fireEvent.click(screen.getByRole("button", { name: "Nova Empresa" }));

    expect(screen.getByRole("heading", { name: "Nova Empresa" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: Metalúrgica Exemplo Ltda")).toBeInTheDocument();
  });
});
