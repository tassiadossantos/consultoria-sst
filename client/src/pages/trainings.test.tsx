import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import Trainings from "./trainings";

describe("Trainings page", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/treinamentos");
  });

  it("renders title and action button", () => {
    render(<Trainings />);

    expect(screen.getByText("Gestão de Treinamentos")).toBeInTheDocument();
    expect(screen.getByText("Novo Treinamento")).toBeInTheDocument();
  });

  it("renders training table with statuses", () => {
    render(<Trainings />);

    expect(screen.getByText("NR-35 Trabalho em Altura (Renovação)")).toBeInTheDocument();
    expect(screen.getByText("Agendado")).toBeInTheDocument();
    expect(screen.getByText("Vencido")).toBeInTheDocument();
    expect(screen.getByText("Vencendo")).toBeInTheDocument();
  });

  it("shows expiring employees from dashboard context", () => {
    window.history.pushState({}, "", "/treinamentos?busca=Metalúrgica%20Aço%20Forte%20NR-35");

    render(<Trainings />);

    expect(screen.getByDisplayValue("Metalúrgica Aço Forte NR-35")).toBeInTheDocument();
    expect(screen.getByText(/Ana Souza/i)).toBeInTheDocument();
    expect(screen.getByText(/Bruno Lima/i)).toBeInTheDocument();
    expect(screen.getByText(/Carla Santos/i)).toBeInTheDocument();
  });

  it("opens new training dialog when clicking Novo Treinamento", () => {
    render(<Trainings />);

    fireEvent.click(screen.getByRole("button", { name: "Novo Treinamento" }));

    expect(screen.getByRole("heading", { name: "Novo Treinamento" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: NR-35 Trabalho em Altura")).toBeInTheDocument();
  });

  it("navigates to realized trainings when clicking Realizados (Mês)", () => {
    render(<Trainings />);

    const realizedCardLink = screen.getByText("Realizados (Mês)").closest("a");

    expect(realizedCardLink).toHaveAttribute("href", "/treinamentos?status=realizado");
  });

  it("shows dynamic realized count from monthly data", () => {
    render(<Trainings />);

    const realizedCardLink = screen.getByText("Realizados (Mês)").closest("a");

    expect(realizedCardLink).toBeInTheDocument();
    expect(within(realizedCardLink as HTMLElement).getByText("12")).toBeInTheDocument();
  });

  it("filters by status from query param even with empty search", () => {
    window.history.pushState({}, "", "/treinamentos?status=realizado");

    render(<Trainings />);

    expect(screen.getByText("NR-35 Trabalho em Altura")).toBeInTheDocument();
    expect(screen.queryByText("NR-10 Segurança em Eletricidade")).not.toBeInTheDocument();
    expect(screen.queryByText("NR-05 CIPA")).not.toBeInTheDocument();
  });
});
