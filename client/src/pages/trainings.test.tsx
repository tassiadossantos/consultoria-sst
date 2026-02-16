import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Trainings from "./trainings";

describe("Trainings page", () => {
  it("renders title and action button", () => {
    render(<Trainings />);

    expect(screen.getByText("Gestão de Treinamentos")).toBeInTheDocument();
    expect(screen.getByText("Novo Treinamento")).toBeInTheDocument();
  });

  it("renders training table with statuses", () => {
    render(<Trainings />);

    expect(screen.getByText("NR-35 Trabalho em Altura")).toBeInTheDocument();
    expect(screen.getByText("Agendado")).toBeInTheDocument();
    expect(screen.getByText("Vencido")).toBeInTheDocument();
  });
});
