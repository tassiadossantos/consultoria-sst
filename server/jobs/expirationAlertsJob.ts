import { randomUUID } from "crypto";
import { and, eq, isNotNull } from "drizzle-orm";
import { companies, pgrs, settings, tenants, trainings } from "@shared/schema";

const DEFAULT_ALERT_DAYS = 15;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

type JobLogger = Pick<Console, "info" | "warn" | "error">;

type Database = (typeof import("../db"))["db"];

let cachedDb: Database | null = null;

async function resolveDb(): Promise<Database> {
  if (cachedDb) {
    return cachedDb;
  }

  const module = await import("../db");
  cachedDb = module.db;
  return cachedDb;
}

export type TenantAlertConfig = {
  tenantId: string;
  tenantName: string;
  alertDays: number;
};

export type PgrDueRecord = {
  id: string;
  status: string;
  validUntil: string;
  companyName: string | null;
};

export type TrainingDueRecord = {
  id: string;
  title: string;
  status: string;
  trainingDate: string;
  companyName: string | null;
};

export type ExpirationAlertType = "pgr" | "training";

export type ExpirationAlert = {
  type: ExpirationAlertType;
  tenantId: string;
  tenantName: string;
  entityId: string;
  title: string;
  companyName: string | null;
  dueDate: string;
  daysUntilDue: number;
};

export type ExpirationAlertJobResult = {
  correlationId: string;
  executedAt: string;
  tenantsEvaluated: number;
  alerts: ExpirationAlert[];
};

export interface ExpirationAlertsRepository {
  listTenantAlertConfigs(): Promise<TenantAlertConfig[]>;
  listTenantPgrDueRecords(tenantId: string): Promise<PgrDueRecord[]>;
  listTenantTrainingDueRecords(tenantId: string): Promise<TrainingDueRecord[]>;
}

function sanitizeAlertDays(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_ALERT_DAYS;
  }

  const normalized = Math.floor(value);
  return normalized > 0 ? normalized : DEFAULT_ALERT_DAYS;
}

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

function calculateDaysUntil(date: Date, now: Date): number {
  const target = startOfDay(date).getTime();
  const current = startOfDay(now).getTime();
  return Math.round((target - current) / ONE_DAY_MS);
}

function isPgrStatusEligibleForExpirationAlert(status: string): boolean {
  return status !== "expired";
}

function isTrainingStatusEligibleForExpirationAlert(status: string): boolean {
  return status !== "realizado";
}

export function buildExpirationAlertsForTenant(
  tenantConfig: TenantAlertConfig,
  pgrRecords: PgrDueRecord[],
  trainingRecords: TrainingDueRecord[],
  now: Date,
): ExpirationAlert[] {
  const alerts: ExpirationAlert[] = [];
  const alertDays = sanitizeAlertDays(tenantConfig.alertDays);

  for (const record of pgrRecords) {
    if (!isPgrStatusEligibleForExpirationAlert(record.status)) {
      continue;
    }

    const due = parseDateLike(record.validUntil);
    if (!due) {
      continue;
    }

    const daysUntilDue = calculateDaysUntil(due, now);
    if (daysUntilDue < 0 || daysUntilDue > alertDays) {
      continue;
    }

    alerts.push({
      type: "pgr",
      tenantId: tenantConfig.tenantId,
      tenantName: tenantConfig.tenantName,
      entityId: record.id,
      title: `PGR ${record.id}`,
      companyName: record.companyName,
      dueDate: record.validUntil,
      daysUntilDue,
    });
  }

  for (const record of trainingRecords) {
    if (!isTrainingStatusEligibleForExpirationAlert(record.status)) {
      continue;
    }

    const due = parseDateLike(record.trainingDate);
    if (!due) {
      continue;
    }

    const daysUntilDue = calculateDaysUntil(due, now);
    if (daysUntilDue < 0 || daysUntilDue > alertDays) {
      continue;
    }

    alerts.push({
      type: "training",
      tenantId: tenantConfig.tenantId,
      tenantName: tenantConfig.tenantName,
      entityId: record.id,
      title: record.title,
      companyName: record.companyName,
      dueDate: record.trainingDate,
      daysUntilDue,
    });
  }

  return alerts;
}

export const databaseExpirationAlertsRepository: ExpirationAlertsRepository = {
  async listTenantAlertConfigs(): Promise<TenantAlertConfig[]> {
    const database = await resolveDb();
    const rows = await database
      .select({
        tenantId: tenants.id,
        tenantName: tenants.name,
        alertDays: settings.alert_days,
      })
      .from(tenants)
      .leftJoin(settings, eq(settings.tenant_id, tenants.id));

    return rows.map((row) => ({
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      alertDays: sanitizeAlertDays(row.alertDays ?? DEFAULT_ALERT_DAYS),
    }));
  },

  async listTenantPgrDueRecords(tenantId: string): Promise<PgrDueRecord[]> {
    const database = await resolveDb();
    const rows = await database
      .select({
        id: pgrs.id,
        status: pgrs.status,
        validUntil: pgrs.valid_until,
        companyName: companies.name,
      })
      .from(pgrs)
      .leftJoin(
        companies,
        and(eq(pgrs.company_id, companies.id), eq(companies.tenant_id, tenantId)),
      )
      .where(and(eq(pgrs.tenant_id, tenantId), isNotNull(pgrs.valid_until)));

    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      validUntil: row.validUntil!,
      companyName: row.companyName,
    }));
  },

  async listTenantTrainingDueRecords(tenantId: string): Promise<TrainingDueRecord[]> {
    const database = await resolveDb();
    const rows = await database
      .select({
        id: trainings.id,
        title: trainings.title,
        status: trainings.status,
        trainingDate: trainings.training_date,
        companyName: companies.name,
      })
      .from(trainings)
      .leftJoin(
        companies,
        and(eq(trainings.company_id, companies.id), eq(companies.tenant_id, tenantId)),
      )
      .where(eq(trainings.tenant_id, tenantId));

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      status: row.status,
      trainingDate: row.trainingDate,
      companyName: row.companyName,
    }));
  },
};

type RunExpirationAlertsJobOptions = {
  repository?: ExpirationAlertsRepository;
  logger?: JobLogger;
  now?: Date;
  correlationId?: string;
};

export async function runExpirationAlertsJob(
  options: RunExpirationAlertsJobOptions = {},
): Promise<ExpirationAlertJobResult> {
  const repository = options.repository ?? databaseExpirationAlertsRepository;
  const logger = options.logger ?? console;
  const now = options.now ?? new Date();
  const correlationId = options.correlationId ?? randomUUID();

  const tenantConfigs = await repository.listTenantAlertConfigs();
  const alerts: ExpirationAlert[] = [];

  for (const tenantConfig of tenantConfigs) {
    const [tenantPgrs, tenantTrainings] = await Promise.all([
      repository.listTenantPgrDueRecords(tenantConfig.tenantId),
      repository.listTenantTrainingDueRecords(tenantConfig.tenantId),
    ]);

    alerts.push(
      ...buildExpirationAlertsForTenant(
        tenantConfig,
        tenantPgrs,
        tenantTrainings,
        now,
      ),
    );
  }

  if (alerts.length === 0) {
    logger.info(
      `[JOB][expiration-alerts] correlation_id=${correlationId} no pending expirations within configured windows (tenants=${tenantConfigs.length})`,
    );
  } else {
    for (const alert of alerts) {
      logger.warn(
        `[ALERT][expiration] correlation_id=${correlationId} tenant=${alert.tenantId} type=${alert.type} entity=${alert.entityId} due=${alert.dueDate} days_until_due=${alert.daysUntilDue} company=${alert.companyName ?? "-"}`,
      );
    }
    logger.info(
      `[JOB][expiration-alerts] correlation_id=${correlationId} completed with ${alerts.length} alert(s) across ${tenantConfigs.length} tenant(s)`,
    );
  }

  return {
    correlationId,
    executedAt: now.toISOString(),
    tenantsEvaluated: tenantConfigs.length,
    alerts,
  };
}
