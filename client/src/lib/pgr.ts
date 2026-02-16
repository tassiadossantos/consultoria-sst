import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase";

export type PgrStatus = "draft" | "active" | "expired" | "pending_review";

export interface CompanyRecord {
  id: string;
  name: string;
  trade_name: string | null;
  cnpj: string | null;
  cnae: string | null;
  address: string | null;
  employees: number | null;
  risk_level: number | null;
  legal_responsible: string | null;
  created_at: string;
}

export interface PgrRecord {
  id: string;
  company_id: string;
  status: PgrStatus;
  revision: number;
  valid_until: string | null;
  created_at: string;
  updated_at: string | null;
  characterization: string | null;
  responsibilities: string | null;
  risk_criteria: string | null;
  control_measures: string | null;
  training_plan: string | null;
  monitoring: string | null;
  responsible_name: string | null;
  responsible_registry: string | null;
  progress: number | null;
}

export interface PgrRiskRecord {
  id: string;
  pgr_id: string;
  sector: string | null;
  role: string | null;
  activity: string | null;
  hazard: string | null;
  risk: string | null;
  risk_type: string | null;
  probability: number | null;
  severity: number | null;
  risk_score: number | null;
  risk_level: string | null;
  controls: string | null;
  epi: string | null;
}

export interface PgrActionRecord {
  id: string;
  pgr_id: string;
  action: string | null;
  owner: string | null;
  due_date: string | null;
  status: string | null;
}

export interface PgrListItem {
  id: string;
  status: PgrStatus;
  revision: number;
  valid_until: string | null;
  created_at: string;
  progress: number | null;
  company: Pick<CompanyRecord, "id" | "name" | "cnpj"> | null;
}

export interface PgrDetail {
  pgr: PgrRecord;
  company: CompanyRecord | null;
  risks: PgrRiskRecord[];
  actions: PgrActionRecord[];
}

export interface CreatePgrPayload {
  company: Omit<CompanyRecord, "id" | "created_at">;
  pgr: Omit<PgrRecord, "id" | "company_id" | "created_at" | "updated_at">;
  risks: Omit<PgrRiskRecord, "id" | "pgr_id">[];
  actions: Omit<PgrActionRecord, "id" | "pgr_id">[];
}

export interface UpdatePgrPayload extends CreatePgrPayload {
  pgrId: string;
  companyId: string;
}

export const listPgrs = async (): Promise<PgrListItem[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("pgrs")
    .select(
      "id,status,revision,valid_until,created_at,progress,company:companies(id,name,cnpj)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as PgrListItem[];
};

export const getPgrDetail = async (id: string): Promise<PgrDetail> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const supabase = getSupabaseClient();

  const { data: pgrData, error: pgrError } = await supabase
    .from("pgrs")
    .select("*, company:companies(*)")
    .eq("id", id)
    .single();

  if (pgrError) {
    throw pgrError;
  }

  const { data: risksData, error: risksError } = await supabase
    .from("pgr_risks")
    .select("*")
    .eq("pgr_id", id)
    .order("created_at", { ascending: true });

  if (risksError) {
    throw risksError;
  }

  const { data: actionsData, error: actionsError } = await supabase
    .from("pgr_actions")
    .select("*")
    .eq("pgr_id", id)
    .order("created_at", { ascending: true });

  if (actionsError) {
    throw actionsError;
  }

  return {
    pgr: pgrData as PgrRecord,
    company: (pgrData as any).company as CompanyRecord,
    risks: (risksData ?? []) as PgrRiskRecord[],
    actions: (actionsData ?? []) as PgrActionRecord[],
  };
};

export const createPgr = async (payload: CreatePgrPayload): Promise<string> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const supabase = getSupabaseClient();

  const { company, pgr, risks, actions } = payload;

  const { data: existingCompany, error: existingError } = await supabase
    .from("companies")
    .select("id")
    .eq("cnpj", company.cnpj ?? "")
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  let companyId = existingCompany?.id;

  if (!companyId) {
    const { data: newCompany, error: insertCompanyError } = await supabase
      .from("companies")
      .insert(company)
      .select("id")
      .single();

    if (insertCompanyError) {
      throw insertCompanyError;
    }

    companyId = newCompany.id as string;
  }

  const { data: newPgr, error: pgrError } = await supabase
    .from("pgrs")
    .insert({ ...pgr, company_id: companyId })
    .select("id")
    .single();

  if (pgrError) {
    throw pgrError;
  }

  const pgrId = newPgr.id as string;

  if (risks.length > 0) {
    const { error: riskError } = await supabase
      .from("pgr_risks")
      .insert(risks.map((risk) => ({ ...risk, pgr_id: pgrId })));

    if (riskError) {
      throw riskError;
    }
  }

  if (actions.length > 0) {
    const { error: actionError } = await supabase
      .from("pgr_actions")
      .insert(actions.map((action) => ({ ...action, pgr_id: pgrId })));

    if (actionError) {
      throw actionError;
    }
  }

  return pgrId;
};

export const updatePgr = async (payload: UpdatePgrPayload): Promise<string> => {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase não configurado");
  }

  const supabase = getSupabaseClient();

  const { company, pgr, risks, actions, pgrId, companyId } = payload;

  const { error: companyError } = await supabase
    .from("companies")
    .update(company)
    .eq("id", companyId);

  if (companyError) {
    throw companyError;
  }

  const { error: pgrError } = await supabase
    .from("pgrs")
    .update({ ...pgr, updated_at: new Date().toISOString() })
    .eq("id", pgrId);

  if (pgrError) {
    throw pgrError;
  }

  const { error: deleteRisksError } = await supabase
    .from("pgr_risks")
    .delete()
    .eq("pgr_id", pgrId);

  if (deleteRisksError) {
    throw deleteRisksError;
  }

  const { error: deleteActionsError } = await supabase
    .from("pgr_actions")
    .delete()
    .eq("pgr_id", pgrId);

  if (deleteActionsError) {
    throw deleteActionsError;
  }

  if (risks.length > 0) {
    const { error: riskError } = await supabase
      .from("pgr_risks")
      .insert(risks.map((risk) => ({ ...risk, pgr_id: pgrId })));

    if (riskError) {
      throw riskError;
    }
  }

  if (actions.length > 0) {
    const { error: actionError } = await supabase
      .from("pgr_actions")
      .insert(actions.map((action) => ({ ...action, pgr_id: pgrId })));

    if (actionError) {
      throw actionError;
    }
  }

  return pgrId;
};
