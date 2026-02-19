const ONE_DAY_MS = 24 * 60 * 60 * 1000;
export const DEFAULT_EXPIRING_WINDOW_DAYS = 7;

export type DueStatus = "invalid" | "expired" | "expiring" | "future";

type DueMetadata = {
  status: DueStatus;
  daysUntilDue: number | null;
};

type TrainingLike = {
  training_date: string;
  status: string;
};

function parseDateLike(value: string): Date | null {
  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function calculateDaysUntil(targetDate: Date, now: Date): number {
  const target = startOfDay(targetDate).getTime();
  const current = startOfDay(now).getTime();
  return Math.round((target - current) / ONE_DAY_MS);
}

export function parseWindowDays(value: unknown, fallback = DEFAULT_EXPIRING_WINDOW_DAYS): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const normalized = Math.floor(parsed);
  if (normalized <= 0) {
    return fallback;
  }

  return normalized;
}

export function getTrainingDueMetadata(
  trainingDate: string,
  now: Date,
  windowDays: number,
): DueMetadata {
  const dueDate = parseDateLike(trainingDate);
  if (!dueDate) {
    return { status: "invalid", daysUntilDue: null };
  }

  const daysUntilDue = calculateDaysUntil(dueDate, now);
  if (daysUntilDue < 0) {
    return { status: "expired", daysUntilDue };
  }

  if (daysUntilDue <= windowDays) {
    return { status: "expiring", daysUntilDue };
  }

  return { status: "future", daysUntilDue };
}

function isTrainingEligibleForDueCalculation(status: string): boolean {
  return status !== "realizado";
}

export function listExpiringTrainingsByDate<T extends TrainingLike>(
  trainings: T[],
  now: Date,
  windowDays: number,
): Array<T & { days_until_due: number }> {
  const expiring = trainings
    .filter((training) => isTrainingEligibleForDueCalculation(training.status))
    .map((training) => {
      const metadata = getTrainingDueMetadata(training.training_date, now, windowDays);
      return { training, metadata };
    })
    .filter((item) => item.metadata.status === "expiring" && item.metadata.daysUntilDue !== null)
    .map((item) => ({
      ...item.training,
      days_until_due: item.metadata.daysUntilDue as number,
    }));

  expiring.sort((a, b) => {
    if (a.days_until_due !== b.days_until_due) {
      return a.days_until_due - b.days_until_due;
    }

    return a.training_date.localeCompare(b.training_date);
  });

  return expiring;
}
