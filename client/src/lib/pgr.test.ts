import { beforeEach, describe, expect, it, vi } from "vitest";

const apiRequestMock = vi.hoisted(() => vi.fn());

vi.mock("./queryClient", () => ({
  apiRequest: apiRequestMock,
}));

import {
  createPgr,
  deletePgrApi,
  fetchPgrDetail,
  fetchPgrs,
  updatePgr,
} from "./api";
import type { CreatePgrPayload, UpdatePgrPayload } from "@shared/schema";

function createPayload(): CreatePgrPayload {
  return {
    company: {
      name: "Empresa Teste",
      trade_name: null,
      cnpj: "00.000.000/0000-00",
      cnae: null,
      address: null,
      employees: 10,
      risk_level: 2,
      legal_responsible: null,
    },
    pgr: {
      status: "draft",
      revision: 0,
      valid_until: null,
      characterization: null,
      responsibilities: null,
      risk_criteria: null,
      control_measures: null,
      training_plan: null,
      monitoring: null,
      responsible_name: null,
      responsible_registry: null,
      progress: 0,
    },
    risks: [],
    actions: [],
  };
}

describe("api – pgr functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetchPgrs calls GET /api/pgrs and returns data", async () => {
    const mockData = [{ id: "pgr-1", status: "active" }];
    apiRequestMock.mockResolvedValue({ json: () => Promise.resolve(mockData) });

    const result = await fetchPgrs();

    expect(apiRequestMock).toHaveBeenCalledWith("GET", "/api/pgrs");
    expect(result).toEqual(mockData);
  });

  it("fetchPgrDetail calls GET /api/pgrs/:id", async () => {
    const mockDetail = { pgr: { id: "pgr-1" }, company: null, risks: [], actions: [] };
    apiRequestMock.mockResolvedValue({ json: () => Promise.resolve(mockDetail) });

    const result = await fetchPgrDetail("pgr-1");

    expect(apiRequestMock).toHaveBeenCalledWith("GET", "/api/pgrs/pgr-1");
    expect(result).toEqual(mockDetail);
  });

  it("createPgr calls POST /api/pgrs and returns id", async () => {
    apiRequestMock.mockResolvedValue({ json: () => Promise.resolve({ id: "pgr-new" }) });

    const result = await createPgr(createPayload());

    expect(apiRequestMock).toHaveBeenCalledWith("POST", "/api/pgrs", expect.any(Object));
    expect(result).toBe("pgr-new");
  });

  it("updatePgr calls PUT /api/pgrs/:id and returns id", async () => {
    apiRequestMock.mockResolvedValue({ json: () => Promise.resolve({ id: "pgr-1" }) });

    const payload: UpdatePgrPayload = {
      ...createPayload(),
      pgrId: "pgr-1",
      companyId: "company-1",
    };

    const result = await updatePgr(payload);

    expect(apiRequestMock).toHaveBeenCalledWith("PUT", "/api/pgrs/pgr-1", expect.any(Object));
    expect(result).toBe("pgr-1");
  });

  it("deletePgrApi calls DELETE /api/pgrs/:id", async () => {
    apiRequestMock.mockResolvedValue({});

    await deletePgrApi("pgr-1");

    expect(apiRequestMock).toHaveBeenCalledWith("DELETE", "/api/pgrs/pgr-1");
  });
});
