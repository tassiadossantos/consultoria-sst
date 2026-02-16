import { beforeEach, describe, expect, it, vi } from "vitest";

const isSupabaseConfiguredMock = vi.hoisted(() => vi.fn());
const getSupabaseClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  isSupabaseConfigured: isSupabaseConfiguredMock,
  getSupabaseClient: getSupabaseClientMock,
}));

import {
  createPgr,
  getPgrDetail,
  listPgrs,
  updatePgr,
  type CreatePgrPayload,
  type UpdatePgrPayload,
} from "./pgr";

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

describe("pgr service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("listPgrs returns empty array when supabase is not configured", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    await expect(listPgrs()).resolves.toEqual([]);
    expect(getSupabaseClientMock).not.toHaveBeenCalled();
  });

  it("listPgrs fetches and returns list when configured", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);

    const orderMock = vi.fn().mockResolvedValue({
      data: [{ id: "pgr-1", status: "active", company: { id: "1", name: "A", cnpj: null } }],
      error: null,
    });
    const selectMock = vi.fn().mockReturnValue({ order: orderMock });
    const fromMock = vi.fn().mockReturnValue({ select: selectMock });

    getSupabaseClientMock.mockReturnValue({ from: fromMock });

    const result = await listPgrs();

    expect(fromMock).toHaveBeenCalledWith("pgrs");
    expect(selectMock).toHaveBeenCalled();
    expect(orderMock).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result[0]?.id).toBe("pgr-1");
  });

  it("getPgrDetail throws when not configured", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    await expect(getPgrDetail("pgr-1")).rejects.toThrow("Supabase não configurado");
  });

  it("createPgr throws when not configured", async () => {
    isSupabaseConfiguredMock.mockReturnValue(false);

    await expect(createPgr(createPayload())).rejects.toThrow("Supabase não configurado");
  });

  it("createPgr inserts company and pgr when company does not exist", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);

    const maybeSingleMock = vi.fn().mockResolvedValue({ data: null, error: null });
    const companySelectMock = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock }) });

    const insertedCompany = { id: "company-1" };
    const insertCompanySingleMock = vi.fn().mockResolvedValue({ data: insertedCompany, error: null });
    const companyInsertSelectMock = vi.fn().mockReturnValue({ single: insertCompanySingleMock });
    const companyInsertMock = vi.fn().mockReturnValue({ select: companyInsertSelectMock });

    const insertedPgr = { id: "pgr-1" };
    const insertPgrSingleMock = vi.fn().mockResolvedValue({ data: insertedPgr, error: null });
    const pgrInsertSelectMock = vi.fn().mockReturnValue({ single: insertPgrSingleMock });
    const pgrInsertMock = vi.fn().mockReturnValue({ select: pgrInsertSelectMock });

    const fromMock = vi.fn((table: string) => {
      if (table === "companies") {
        return { select: companySelectMock, insert: companyInsertMock };
      }
      if (table === "pgrs") {
        return { insert: pgrInsertMock };
      }
      return { insert: vi.fn().mockResolvedValue({ error: null }) };
    });

    getSupabaseClientMock.mockReturnValue({ from: fromMock });

    const result = await createPgr(createPayload());

    expect(result).toBe("pgr-1");
  });

  it("updatePgr updates and recreates relations", async () => {
    isSupabaseConfiguredMock.mockReturnValue(true);

    const updateEqCompanyMock = vi.fn().mockResolvedValue({ error: null });
    const updateCompanyMock = vi.fn().mockReturnValue({ eq: updateEqCompanyMock });

    const updateEqPgrMock = vi.fn().mockResolvedValue({ error: null });
    const updatePgrMock = vi.fn().mockReturnValue({ eq: updateEqPgrMock });

    const deleteEqRisksMock = vi.fn().mockResolvedValue({ error: null });
    const deleteRisksMock = vi.fn().mockReturnValue({ eq: deleteEqRisksMock });

    const deleteEqActionsMock = vi.fn().mockResolvedValue({ error: null });
    const deleteActionsMock = vi.fn().mockReturnValue({ eq: deleteEqActionsMock });

    const fromMock = vi.fn((table: string) => {
      if (table === "companies") {
        return { update: updateCompanyMock };
      }
      if (table === "pgrs") {
        return { update: updatePgrMock };
      }
      if (table === "pgr_risks") {
        return { delete: deleteRisksMock, insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      if (table === "pgr_actions") {
        return { delete: deleteActionsMock, insert: vi.fn().mockResolvedValue({ error: null }) };
      }
      return {};
    });

    getSupabaseClientMock.mockReturnValue({ from: fromMock });

    const payload: UpdatePgrPayload = {
      ...createPayload(),
      pgrId: "pgr-1",
      companyId: "company-1",
      risks: [{
        sector: "S",
        role: "R",
        activity: "A",
        hazard: "H",
        risk: "R",
        risk_type: "fisico",
        probability: 1,
        severity: 1,
        risk_score: 1,
        risk_level: "Baixo",
        controls: null,
        epi: null,
      }],
      actions: [{ action: "Acao", owner: "Resp", due_date: null, status: "aberta" }],
    };

    await expect(updatePgr(payload)).resolves.toBe("pgr-1");
    expect(updateEqCompanyMock).toHaveBeenCalledWith("id", "company-1");
    expect(updateEqPgrMock).toHaveBeenCalledWith("id", "pgr-1");
    expect(deleteEqRisksMock).toHaveBeenCalledWith("pgr_id", "pgr-1");
    expect(deleteEqActionsMock).toHaveBeenCalledWith("pgr_id", "pgr-1");
  });
});
