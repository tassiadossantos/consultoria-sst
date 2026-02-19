import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchTrainingsMock = vi.hoisted(() => vi.fn());
const fetchExpiringTrainingsMock = vi.hoisted(() => vi.fn());
const createTrainingApiMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/api", () => ({
  fetchTrainings: fetchTrainingsMock,
  fetchExpiringTrainings: fetchExpiringTrainingsMock,
  createTrainingApi: createTrainingApiMock,
}));

import Trainings from "./trainings";

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Trainings />
    </QueryClientProvider>,
  );
}

describe("Trainings page", () => {
  const now = new Date();
  const thisMonthDate = new Date(now.getFullYear(), now.getMonth(), 15)
    .toISOString()
    .slice(0, 10);
  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 10)
    .toISOString()
    .slice(0, 10);
  const previousMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 10)
    .toISOString()
    .slice(0, 10);

  const trainingsFixture = [
    {
      id: "t-1",
      title: "NR-35 Trabalho em Altura",
      training_date: thisMonthDate,
      instructor: "João Dias",
      participants_count: 12,
      participants_label: "Ana Souza, Bruno Lima, Carla Santos",
      status: "realizado",
      company_id: "c1",
      notes: null,
      created_at: thisMonthDate,
      updated_at: null,
    },
    {
      id: "t-2",
      title: "NR-10 Segurança em Eletricidade",
      training_date: nextMonthDate,
      instructor: "Maria Lima",
      participants_count: 8,
      participants_label: null,
      status: "agendado",
      company_id: "c2",
      notes: null,
      created_at: thisMonthDate,
      updated_at: null,
    },
    {
      id: "t-3",
      title: "NR-05 CIPA",
      training_date: previousMonthDate,
      instructor: "Carlos Silva",
      participants_count: 6,
      participants_label: null,
      status: "vencido",
      company_id: "c3",
      notes: null,
      created_at: thisMonthDate,
      updated_at: null,
    },
    {
      id: "t-4",
      title: "Metalúrgica Aço Forte NR-35",
      training_date: nextMonthDate,
      instructor: "Téc. SST",
      participants_count: 3,
      participants_label: "Ana Souza, Bruno Lima, Carla Santos",
      status: "vencendo",
      company_id: "c1",
      notes: null,
      created_at: thisMonthDate,
      updated_at: null,
    },
  ];

  const expiringTrainingsFixture = {
    windowDays: 7,
    generatedAt: now.toISOString(),
    totalTrainings: 1,
    totalParticipants: 8,
    items: [
      {
        id: "t-2",
        title: "NR-10 Segurança em Eletricidade",
        training_date: nextMonthDate,
        instructor: "Maria Lima",
        participants_count: 8,
        participants_label: null,
        status: "agendado",
        company_id: "c2",
        notes: null,
        created_at: thisMonthDate,
        updated_at: null,
        days_until_due: 5,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    fetchTrainingsMock.mockResolvedValue(trainingsFixture);
    fetchExpiringTrainingsMock.mockResolvedValue(expiringTrainingsFixture);
    createTrainingApiMock.mockResolvedValue(trainingsFixture[0]);
    window.history.pushState({}, "", "/treinamentos");
  });

  it("renders title and action button", async () => {
    renderPage();

    expect(await screen.findByText("Gestão de Treinamentos")).toBeInTheDocument();
    expect(await screen.findByText("Novo Treinamento")).toBeInTheDocument();
  });

  it("renders training table with statuses", async () => {
    renderPage();

    expect(await screen.findByText("NR-35 Trabalho em Altura")).toBeInTheDocument();
    expect(screen.getByText("Agendado")).toBeInTheDocument();
    expect(screen.getByText("Vencido")).toBeInTheDocument();
    expect(screen.getByText("Vencendo")).toBeInTheDocument();
  });

  it("filters vencendo by backend due-date rule", async () => {
    window.history.pushState({}, "", "/treinamentos?status=vencendo");

    renderPage();

    expect(await screen.findByText("NR-10 Segurança em Eletricidade")).toBeInTheDocument();
    expect(screen.queryByText("NR-35 Trabalho em Altura")).not.toBeInTheDocument();
    expect(screen.queryByText("NR-05 CIPA")).not.toBeInTheDocument();
    expect(screen.getByText("Vencendo")).toBeInTheDocument();
  });

  it("opens new training dialog when clicking Novo Treinamento", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Novo Treinamento" }));

    expect(screen.getByRole("heading", { name: "Novo Treinamento" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Ex: NR-35 Trabalho em Altura")).toBeInTheDocument();
  });

  it("navigates to realized trainings when clicking Realizados (Mês)", async () => {
    renderPage();

    const realizedCardLink = (await screen.findByText("Realizados (Mês)")).closest("a");

    expect(realizedCardLink).toHaveAttribute("href", "/treinamentos?status=realizado");
  });

  it("shows dynamic realized count from monthly data", async () => {
    renderPage();

    const realizedCardLink = (await screen.findByText("Realizados (Mês)")).closest("a");
    await screen.findByText("NR-35 Trabalho em Altura");

    expect(realizedCardLink).toBeInTheDocument();
    expect(within(realizedCardLink as HTMLElement).getByText("12")).toBeInTheDocument();
  });

  it("filters by status from query param even with empty search", async () => {
    window.history.pushState({}, "", "/treinamentos?status=realizado");

    renderPage();

    expect(await screen.findByText("NR-35 Trabalho em Altura")).toBeInTheDocument();
    expect(screen.queryByText("NR-10 Segurança em Eletricidade")).not.toBeInTheDocument();
    expect(screen.queryByText("NR-05 CIPA")).not.toBeInTheDocument();
  });
});
