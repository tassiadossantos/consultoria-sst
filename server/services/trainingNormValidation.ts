import {
  addMonthsToIsoDate,
  extractTrainingNormCodeFromTitle,
  getTrainingNormProfile,
  normalizeTrainingNormCode,
} from "@shared/trainingNormCatalog";

type TrainingNormValidationInput = {
  title: string;
  training_date: string;
  notes?: string | null;
  participants_count?: number | null;
  participants_label?: string | null;
};

type TrainingNotesMetadata = {
  nrCode: string;
  workloadHours: number;
  completedAt: string;
  validityMonths: number;
};

function parseParticipantsLabel(participantsLabel: string | null | undefined): string[] {
  if (!participantsLabel) {
    return [];
  }

  return participantsLabel
    .split(/[,;\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseTrainingNotesMetadata(notes: string | null | undefined): TrainingNotesMetadata | null {
  if (!notes) {
    return null;
  }

  const nrMatch = /(?:^|\|)\s*NR:\s*(NR-\d{2})\s*(?:\||$)/i.exec(notes);
  const workloadMatch = /(?:^|\|)\s*Carga hor[aá]ria:\s*(\d+(?:[.,]\d+)?)h\s*(?:\||$)/i.exec(notes);
  const completedAtMatch = /(?:^|\|)\s*Data da realiza[cç][aã]o:\s*(\d{4}-\d{2}-\d{2})\s*(?:\||$)/i.exec(notes);
  const validityMatch = /(?:^|\|)\s*Validade:\s*(\d+)\s*mes(?:es)?\s*(?:\||$)/i.exec(notes);

  if (!nrMatch || !workloadMatch || !completedAtMatch || !validityMatch) {
    return null;
  }

  const workloadHours = Number(workloadMatch[1].replace(",", "."));
  const validityMonths = Number(validityMatch[1]);

  if (!Number.isFinite(workloadHours) || !Number.isFinite(validityMonths)) {
    return null;
  }

  return {
    nrCode: normalizeTrainingNormCode(nrMatch[1]),
    workloadHours,
    completedAt: completedAtMatch[1],
    validityMonths: Math.floor(validityMonths),
  };
}

export function validateTrainingNormRules(input: TrainingNormValidationInput): string | null {
  const titleNrCode = extractTrainingNormCodeFromTitle(input.title);
  if (!titleNrCode) {
    return "O título do treinamento deve iniciar com a NR (ex.: NR-35).";
  }

  const normProfile = getTrainingNormProfile(titleNrCode);
  if (!normProfile) {
    return `NR não suportada no catálogo: ${titleNrCode}.`;
  }

  const metadata = parseTrainingNotesMetadata(input.notes);
  if (!metadata) {
    return "Metadados obrigatórios do treinamento não encontrados em notes (NR, carga horária, data da realização e validade).";
  }

  if (metadata.nrCode !== normProfile.code) {
    return `NR em notes (${metadata.nrCode}) diferente da NR do título (${normProfile.code}).`;
  }

  if (metadata.validityMonths !== normProfile.validityMonths) {
    return `Validade inválida para ${normProfile.code}. Esperado: ${normProfile.validityMonths} meses.`;
  }

  if (metadata.workloadHours < normProfile.minHours) {
    return `Carga horária inválida para ${normProfile.code}. Mínimo: ${normProfile.minHours}h.`;
  }

  const dueDate = addMonthsToIsoDate(metadata.completedAt, normProfile.validityMonths);
  if (!dueDate) {
    return "Data da realização inválida em notes.";
  }

  if (input.training_date !== dueDate) {
    return `Data de vencimento inválida. Esperado: ${dueDate}.`;
  }

  if (!input.participants_count || input.participants_count <= 0) {
    return "participants_count deve ser maior que zero.";
  }

  const participants = parseParticipantsLabel(input.participants_label);
  if (participants.length === 0) {
    return "participants_label deve conter os nomes dos participantes.";
  }

  if (participants.length !== input.participants_count) {
    return "participants_count deve ser igual à quantidade de participantes em participants_label.";
  }

  return null;
}
