import { getUserRole } from "./auth-token";
export function isAdmin() {
  return getUserRole() === "admin";
}
import { apiRequest } from "./queryClient";
import type {
  Company,
  InsertCompany,
  UpdateCompany,
  Training,
  InsertTraining,
  UpdateTraining,
  PgrListItem,
  PgrDetail,
  CreatePgrPayload,
  UpdatePgrPayload,
  DocumentPdfPayload,
} from "@shared/schema";

export type SstNewsItem = {
  title: string;
  summary: string;
  link: string;
  publishedAt: string;
};

export type SstNewsResponse = {
  sourceUrl: string;
  items: SstNewsItem[];
};

export type ExpiringTrainingsResponse = {
  windowDays: number;
  generatedAt: string;
  totalTrainings: number;
  totalParticipants: number;
  items: Array<Training & { days_until_due: number }>;
};

export type DeletePgrOptions = {
  deleteOrphanCompany?: boolean;
};

export type GenerateDocumentPdfResponse = {
  blob: Blob;
  filename: string;
};

function parseDownloadFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const quotedMatch = /filename=\"([^\"]+)\"/i.exec(contentDisposition);
  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const simpleMatch = /filename=([^;]+)/i.exec(contentDisposition);
  if (simpleMatch?.[1]) {
    return simpleMatch[1].trim();
  }

  return fallback;
}

// ── SST News ──────────────────────────────────────────────

export async function fetchSstNews(): Promise<SstNewsResponse> {
  const res = await apiRequest("GET", "/api/sst-news");
  return res.json();
}

// ── Companies ──────────────────────────────────────────────

export async function fetchCompanies(): Promise<Company[]> {
  const res = await apiRequest("GET", "/api/companies");
  return res.json();
}

export async function fetchCompany(id: string): Promise<Company> {
  const res = await apiRequest("GET", `/api/companies/${id}`);
  return res.json();
}

export async function createCompanyApi(data: InsertCompany): Promise<Company> {
  const res = await apiRequest("POST", "/api/companies", data);
  return res.json();
}

export async function updateCompanyApi(
  id: string,
  data: UpdateCompany,
): Promise<Company> {
  const res = await apiRequest("PUT", `/api/companies/${id}`, data);
  return res.json();
}

export async function deleteCompanyApi(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/companies/${id}`);
}

// ── PGRs ───────────────────────────────────────────────────

export async function fetchPgrs(): Promise<PgrListItem[]> {
  const res = await apiRequest("GET", "/api/pgrs");
  return res.json();
}

export async function fetchPgrDetail(id: string): Promise<PgrDetail> {
  const res = await apiRequest("GET", `/api/pgrs/${id}`);
  return res.json();
}

export async function downloadPgrPdf(id: string): Promise<Blob> {
  const res = await apiRequest("GET", `/api/pgrs/${id}/pdf`);
  return res.blob();
}

export async function generateDocumentPdf(
  payload: DocumentPdfPayload,
): Promise<GenerateDocumentPdfResponse> {
  const fallbackFilename = `documento-${payload.template_id || "sst"}.pdf`;
  const res = await apiRequest("POST", "/api/documents/pdf", payload);
  const blob = await res.blob();
  const filename = parseDownloadFilename(
    res.headers.get("content-disposition"),
    fallbackFilename,
  );

  return {
    blob,
    filename,
  };
}

export async function createPgr(
  payload: CreatePgrPayload,
): Promise<string> {
  const res = await apiRequest("POST", "/api/pgrs", payload);
  const body = await res.json();
  return body.id;
}

export async function updatePgr(
  payload: UpdatePgrPayload,
): Promise<string> {
  const res = await apiRequest("PUT", `/api/pgrs/${payload.pgrId}`, payload);
  const body = await res.json();
  return body.id;
}

export async function deletePgrApi(id: string, options: DeletePgrOptions = {}): Promise<void> {
  const params = new URLSearchParams();
  if (options.deleteOrphanCompany) {
    params.set("delete_orphan_company", "1");
  }

  const query = params.toString();
  const endpoint = query ? `/api/pgrs/${id}?${query}` : `/api/pgrs/${id}`;
  await apiRequest("DELETE", endpoint);
}

// ── Trainings ──────────────────────────────────────────────

export async function fetchTrainings(): Promise<Training[]> {
  const res = await apiRequest("GET", "/api/trainings");
  return res.json();
}

export async function fetchExpiringTrainings(windowDays = 7): Promise<ExpiringTrainingsResponse> {
  const res = await apiRequest("GET", `/api/trainings/expiring?window_days=${windowDays}`);
  return res.json();
}

export async function fetchTraining(id: string): Promise<Training> {
  const res = await apiRequest("GET", `/api/trainings/${id}`);
  return res.json();
}

export async function createTrainingApi(
  data: InsertTraining,
): Promise<Training> {
  const res = await apiRequest("POST", "/api/trainings", data);
  return res.json();
}

export async function updateTrainingApi(
  id: string,
  data: UpdateTraining,
): Promise<Training> {
  const res = await apiRequest("PUT", `/api/trainings/${id}`, data);
  return res.json();
}

export async function deleteTrainingApi(id: string): Promise<void> {
  await apiRequest("DELETE", `/api/trainings/${id}`);
}
