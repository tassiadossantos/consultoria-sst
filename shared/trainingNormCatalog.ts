export type TrainingNormProfile = {
  code: string;
  label: string;
  minHours: number;
  validityMonths: number;
};

export const trainingNormProfiles: TrainingNormProfile[] = [
  { code: "NR-05", label: "CIPA", minHours: 20, validityMonths: 12 },
  { code: "NR-10", label: "Segurança em Instalações Elétricas", minHours: 40, validityMonths: 24 },
  { code: "NR-12", label: "Máquinas e Equipamentos", minHours: 8, validityMonths: 24 },
  { code: "NR-33", label: "Espaços Confinados", minHours: 16, validityMonths: 12 },
  { code: "NR-35", label: "Trabalho em Altura", minHours: 8, validityMonths: 24 },
];

const profilesByCode = new Map(
  trainingNormProfiles.map((profile) => [profile.code.toUpperCase(), profile]),
);

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return false;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  return true;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addMonthsToIsoDate(isoDate: string, monthsToAdd: number): string {
  const [yearRaw, monthRaw, dayRaw] = isoDate.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!isValidDateParts(year, month, day)) {
    return "";
  }

  const sourceDate = new Date(year, month - 1, day);
  if (Number.isNaN(sourceDate.getTime())) {
    return "";
  }

  const resultDate = new Date(
    sourceDate.getFullYear(),
    sourceDate.getMonth() + monthsToAdd,
    sourceDate.getDate(),
  );
  return toIsoDate(resultDate);
}

export function normalizeTrainingNormCode(code: string): string {
  return code.trim().toUpperCase();
}

export function getTrainingNormProfile(code: string): TrainingNormProfile | undefined {
  const normalized = normalizeTrainingNormCode(code);
  return profilesByCode.get(normalized);
}

export function extractTrainingNormCodeFromTitle(title: string): string | null {
  const match = /^\s*(NR-\d{2})\b/i.exec(title);
  if (!match) {
    return null;
  }

  return normalizeTrainingNormCode(match[1]);
}
