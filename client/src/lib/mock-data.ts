// Mock Data Store for prototype
export interface Company {
  id: string;
  name: string;
  cnpj: string;
  riskLevel: number; // 1-4
  employees: number;
  lastPGR?: string;
}

export interface PGR {
  id: string;
  companyId: string;
  companyName: string;
  status: "active" | "draft" | "expired" | "pending_review";
  createdAt: string;
  validUntil: string;
  revision: number;
  progress: number;
}

export const mockCompanies: Company[] = [
  { id: "1", name: "Metalúrgica Aço Forte Ltda", cnpj: "12.345.678/0001-90", riskLevel: 3, employees: 45, lastPGR: "2024-01-15" },
  { id: "2", name: "Padaria Pão Quente", cnpj: "98.765.432/0001-10", riskLevel: 2, employees: 12, lastPGR: "2024-03-10" },
  { id: "3", name: "Construções Silva & Souza", cnpj: "45.123.789/0001-55", riskLevel: 4, employees: 120, lastPGR: "2023-11-20" },
  { id: "4", name: "Tech Solutions TI", cnpj: "33.221.111/0001-22", riskLevel: 1, employees: 8, lastPGR: "2024-02-01" },
  { id: "5", name: "Oficina Mecânica Rápida", cnpj: "77.889.999/0001-44", riskLevel: 3, employees: 6 },
];

export const mockPGRs: PGR[] = [
  { id: "pgr-1", companyId: "1", companyName: "Metalúrgica Aço Forte Ltda", status: "active", createdAt: "2024-01-15", validUntil: "2026-01-15", revision: 2, progress: 100 },
  { id: "pgr-2", companyId: "2", companyName: "Padaria Pão Quente", status: "active", createdAt: "2024-03-10", validUntil: "2026-03-10", revision: 0, progress: 100 },
  { id: "pgr-3", companyId: "3", companyName: "Construções Silva & Souza", status: "expired", createdAt: "2021-11-20", validUntil: "2023-11-20", revision: 1, progress: 100 },
  { id: "pgr-4", companyId: "5", companyName: "Oficina Mecânica Rápida", status: "draft", createdAt: "2024-05-20", validUntil: "-", revision: 0, progress: 35 },
];

export const riskTypes = [
  { id: "fisico", label: "Físico", color: "bg-green-100 text-green-800" },
  { id: "quimico", label: "Químico", color: "bg-red-100 text-red-800" },
  { id: "biologico", label: "Biológico", color: "bg-amber-800 text-white" },
  { id: "ergonomico", label: "Ergonômico", color: "bg-yellow-100 text-yellow-800" },
  { id: "acidente", label: "Acidente", color: "bg-blue-100 text-blue-800" },
];

export const calculateRiskLevel = (prob: number, sev: number) => {
  const score = prob * sev;
  if (score <= 6) return { label: "Baixo", class: "risk-low", score };
  if (score <= 15) return { label: "Médio", class: "risk-medium", score };
  return { label: "Alto", class: "risk-high", score };
};
