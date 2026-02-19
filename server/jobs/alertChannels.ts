import { randomUUID } from "crypto";
import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";
import {
  alertDispatches,
  alertJobRuns,
  tenantAlertChannels,
} from "@shared/schema";
import type { ExpirationAlert, ExpirationAlertJobResult } from "./expirationAlertsJob";

type JobLogger = Pick<Console, "info" | "warn" | "error">;

const ALERT_CHANNELS = ["webhook", "email", "whatsapp"] as const;
type AlertChannelName = (typeof ALERT_CHANNELS)[number];

const WEBHOOK_TIMEOUT_MS = 10_000;
const STALE_PROCESSING_WINDOW_MS = 10 * 60 * 1000;
const MAX_DUE_BATCH = 500;
const MAX_BACKOFF_SECONDS = 24 * 60 * 60;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_MAX_PER_RUN = 50;
const DEFAULT_BACKOFF_BASE_SECONDS = 60;

type WebhookChannelConfig = {
  channel: "webhook";
  tenantId: string;
  urls: string[];
  bearerToken?: string;
  maxRetries: number;
  maxPerRun: number;
  backoffBaseSeconds: number;
};

type EmailChannelConfig = {
  channel: "email";
  tenantId: string;
  provider: "resend";
  apiKey: string;
  from: string;
  to: string[];
  maxRetries: number;
  maxPerRun: number;
  backoffBaseSeconds: number;
};

type WhatsAppChannelConfig = {
  channel: "whatsapp";
  tenantId: string;
  provider: "meta";
  token: string;
  phoneNumberId: string;
  to: string[];
  maxRetries: number;
  maxPerRun: number;
  backoffBaseSeconds: number;
};

type ResolvedChannelConfig =
  | WebhookChannelConfig
  | EmailChannelConfig
  | WhatsAppChannelConfig;

type TenantChannelConfigMap = Partial<Record<AlertChannelName, ResolvedChannelConfig>>;

type TenantChannelRecord = {
  tenantId: string;
  channel: AlertChannelName;
  enabled: boolean;
  config: Record<string, unknown>;
  maxRetries: number;
  maxPerRun: number;
  backoffBaseSeconds: number;
};

type EnqueueDispatchCandidate = {
  tenantId: string;
  tenantName: string;
  channel: AlertChannelName;
  recipient: string;
  dedupeKey: string;
  alertType: string;
  entityId: string;
  title: string;
  companyName: string | null;
  dueDate: string;
  maxAttempts: number;
  backoffBaseSeconds: number;
  createdCorrelationId: string;
};

type DispatchQueueRecord = {
  id: string;
  tenantId: string;
  tenantName: string;
  channel: AlertChannelName;
  recipient: string;
  alertType: string;
  entityId: string;
  title: string;
  companyName: string | null;
  dueDate: string;
  attempts: number;
  maxAttempts: number;
  backoffBaseSeconds: number;
};

type RunMetricsRecord = {
  correlationId: string;
  instanceId: string;
  executedAt: string;
  tenantsEvaluated: number;
  alertsFound: number;
  queued: number;
  deduplicated: number;
  staleRecovered: number;
  attempted: number;
  delivered: number;
  failed: number;
  retried: number;
};

export interface AlertDispatchRepository {
  listTenantChannelRecords(tenantIds: string[]): Promise<TenantChannelRecord[]>;
  enqueueDispatches(
    candidates: EnqueueDispatchCandidate[],
    now: Date,
  ): Promise<{ queued: number; deduplicated: number }>;
  recoverStaleProcessing(now: Date, staleBefore: Date): Promise<number>;
  listDueDispatches(
    channel: AlertChannelName,
    now: Date,
    limit: number,
  ): Promise<DispatchQueueRecord[]>;
  claimDispatch(
    id: string,
    now: Date,
    instanceId: string,
    correlationId: string,
  ): Promise<DispatchQueueRecord | null>;
  markDispatchSent(
    id: string,
    now: Date,
    instanceId: string,
    correlationId: string,
  ): Promise<void>;
  markDispatchRetry(
    id: string,
    now: Date,
    nextAttemptAt: Date,
    error: string,
    instanceId: string,
    correlationId: string,
  ): Promise<void>;
  markDispatchFailed(
    id: string,
    now: Date,
    error: string,
    instanceId: string,
    correlationId: string,
  ): Promise<void>;
  recordRunMetrics(record: RunMetricsRecord): Promise<void>;
}

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

function normalizeObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => readString(entry))
    .filter((entry): entry is string => Boolean(entry));
}

function splitCsvEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

function sanitizePositiveInt(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  const normalized = Math.floor(value!);
  return normalized > 0 ? normalized : fallback;
}

function isAlertChannelName(value: string): value is AlertChannelName {
  return (ALERT_CHANNELS as readonly string[]).includes(value);
}

function sanitizeChannelRecord(
  row: typeof tenantAlertChannels.$inferSelect,
): TenantChannelRecord | null {
  if (!isAlertChannelName(row.channel)) {
    return null;
  }

  return {
    tenantId: row.tenant_id,
    channel: row.channel,
    enabled: row.enabled,
    config: normalizeObject(row.config),
    maxRetries: sanitizePositiveInt(row.max_retries, DEFAULT_MAX_RETRIES),
    maxPerRun: sanitizePositiveInt(row.max_per_run, DEFAULT_MAX_PER_RUN),
    backoffBaseSeconds: sanitizePositiveInt(
      row.backoff_base_seconds,
      DEFAULT_BACKOFF_BASE_SECONDS,
    ),
  };
}

function parseRecordWebhookConfig(
  record: TenantChannelRecord,
): WebhookChannelConfig | null {
  const urls = readStringArray(record.config.urls);
  if (urls.length === 0) {
    return null;
  }

  return {
    channel: "webhook",
    tenantId: record.tenantId,
    urls,
    bearerToken: readString(record.config.bearerToken),
    maxRetries: record.maxRetries,
    maxPerRun: record.maxPerRun,
    backoffBaseSeconds: record.backoffBaseSeconds,
  };
}

function parseRecordEmailConfig(record: TenantChannelRecord): EmailChannelConfig | null {
  const provider = (readString(record.config.provider) ?? "resend").toLowerCase();
  if (provider !== "resend") {
    return null;
  }

  const apiKey = readString(record.config.apiKey) ?? readString(process.env.ALERTS_EMAIL_API_KEY);
  const from = readString(record.config.from);
  const to = readStringArray(record.config.to);

  if (!apiKey || !from || to.length === 0) {
    return null;
  }

  return {
    channel: "email",
    tenantId: record.tenantId,
    provider: "resend",
    apiKey,
    from,
    to,
    maxRetries: record.maxRetries,
    maxPerRun: record.maxPerRun,
    backoffBaseSeconds: record.backoffBaseSeconds,
  };
}

function parseRecordWhatsAppConfig(
  record: TenantChannelRecord,
): WhatsAppChannelConfig | null {
  const provider = (readString(record.config.provider) ?? "meta").toLowerCase();
  if (provider !== "meta") {
    return null;
  }

  const token = readString(record.config.token) ?? readString(process.env.ALERTS_WHATSAPP_TOKEN);
  const phoneNumberId =
    readString(record.config.phoneNumberId) ??
    readString(process.env.ALERTS_WHATSAPP_PHONE_NUMBER_ID);
  const to = readStringArray(record.config.to);

  if (!token || !phoneNumberId || to.length === 0) {
    return null;
  }

  return {
    channel: "whatsapp",
    tenantId: record.tenantId,
    provider: "meta",
    token,
    phoneNumberId,
    to,
    maxRetries: record.maxRetries,
    maxPerRun: record.maxPerRun,
    backoffBaseSeconds: record.backoffBaseSeconds,
  };
}

function resolveChannelConfigFromRecord(
  record: TenantChannelRecord,
): ResolvedChannelConfig | null {
  if (!record.enabled) {
    return null;
  }

  switch (record.channel) {
    case "webhook":
      return parseRecordWebhookConfig(record);
    case "email":
      return parseRecordEmailConfig(record);
    case "whatsapp":
      return parseRecordWhatsAppConfig(record);
    default:
      return null;
  }
}

function resolveGlobalWebhookConfig(tenantId: string): WebhookChannelConfig | null {
  const urls = splitCsvEnv(process.env.ALERTS_WEBHOOK_URLS);
  if (urls.length === 0) {
    return null;
  }

  return {
    channel: "webhook",
    tenantId,
    urls,
    bearerToken: readString(process.env.ALERTS_WEBHOOK_BEARER_TOKEN),
    maxRetries: sanitizePositiveInt(
      Number(process.env.ALERTS_WEBHOOK_MAX_RETRIES),
      DEFAULT_MAX_RETRIES,
    ),
    maxPerRun: sanitizePositiveInt(
      Number(process.env.ALERTS_WEBHOOK_MAX_PER_RUN),
      DEFAULT_MAX_PER_RUN,
    ),
    backoffBaseSeconds: sanitizePositiveInt(
      Number(process.env.ALERTS_WEBHOOK_BACKOFF_SECONDS),
      DEFAULT_BACKOFF_BASE_SECONDS,
    ),
  };
}

function resolveGlobalEmailConfig(tenantId: string): EmailChannelConfig | null {
  const provider = (process.env.ALERTS_EMAIL_PROVIDER ?? "none").toLowerCase();
  if (provider !== "resend") {
    return null;
  }

  const apiKey = readString(process.env.ALERTS_EMAIL_API_KEY);
  const from = readString(process.env.ALERTS_EMAIL_FROM);
  const to = splitCsvEnv(process.env.ALERTS_EMAIL_TO);

  if (!apiKey || !from || to.length === 0) {
    return null;
  }

  return {
    channel: "email",
    tenantId,
    provider: "resend",
    apiKey,
    from,
    to,
    maxRetries: sanitizePositiveInt(
      Number(process.env.ALERTS_EMAIL_MAX_RETRIES),
      DEFAULT_MAX_RETRIES,
    ),
    maxPerRun: sanitizePositiveInt(
      Number(process.env.ALERTS_EMAIL_MAX_PER_RUN),
      DEFAULT_MAX_PER_RUN,
    ),
    backoffBaseSeconds: sanitizePositiveInt(
      Number(process.env.ALERTS_EMAIL_BACKOFF_SECONDS),
      DEFAULT_BACKOFF_BASE_SECONDS,
    ),
  };
}

function resolveGlobalWhatsAppConfig(tenantId: string): WhatsAppChannelConfig | null {
  const provider = (process.env.ALERTS_WHATSAPP_PROVIDER ?? "none").toLowerCase();
  if (provider !== "meta") {
    return null;
  }

  const token = readString(process.env.ALERTS_WHATSAPP_TOKEN);
  const phoneNumberId = readString(process.env.ALERTS_WHATSAPP_PHONE_NUMBER_ID);
  const to = splitCsvEnv(process.env.ALERTS_WHATSAPP_TO);

  if (!token || !phoneNumberId || to.length === 0) {
    return null;
  }

  return {
    channel: "whatsapp",
    tenantId,
    provider: "meta",
    token,
    phoneNumberId,
    to,
    maxRetries: sanitizePositiveInt(
      Number(process.env.ALERTS_WHATSAPP_MAX_RETRIES),
      DEFAULT_MAX_RETRIES,
    ),
    maxPerRun: sanitizePositiveInt(
      Number(process.env.ALERTS_WHATSAPP_MAX_PER_RUN),
      DEFAULT_MAX_PER_RUN,
    ),
    backoffBaseSeconds: sanitizePositiveInt(
      Number(process.env.ALERTS_WHATSAPP_BACKOFF_SECONDS),
      DEFAULT_BACKOFF_BASE_SECONDS,
    ),
  };
}

function resolveGlobalChannelConfig(
  channel: AlertChannelName,
  tenantId: string,
): ResolvedChannelConfig | null {
  switch (channel) {
    case "webhook":
      return resolveGlobalWebhookConfig(tenantId);
    case "email":
      return resolveGlobalEmailConfig(tenantId);
    case "whatsapp":
      return resolveGlobalWhatsAppConfig(tenantId);
    default:
      return null;
  }
}

function resolveRecipients(config: ResolvedChannelConfig): string[] {
  switch (config.channel) {
    case "webhook":
      return config.urls;
    case "email":
      return config.to;
    case "whatsapp":
      return config.to;
    default:
      return [];
  }
}

function normalizeRecipient(value: string): string {
  return value.trim().toLowerCase();
}

function buildDedupeKey(
  alert: ExpirationAlert,
  channel: AlertChannelName,
  recipient: string,
): string {
  return [
    alert.tenantId,
    channel,
    normalizeRecipient(recipient),
    alert.type,
    alert.entityId,
    alert.dueDate,
  ].join(":");
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

function formatDispatchMessage(dispatch: DispatchQueueRecord, now: Date): string {
  const due = parseDateLike(dispatch.dueDate);
  let dueLabel = `vencimento em ${dispatch.dueDate}`;

  if (due) {
    const daysUntilDue = calculateDaysUntil(due, now);
    if (daysUntilDue === 0) {
      dueLabel = `vence hoje (${dispatch.dueDate})`;
    } else if (daysUntilDue > 0) {
      dueLabel = `vence em ${daysUntilDue} dia(s) (${dispatch.dueDate})`;
    } else {
      dueLabel = `vencido há ${Math.abs(daysUntilDue)} dia(s) (${dispatch.dueDate})`;
    }
  }

  const entityLabel = dispatch.alertType.toUpperCase();
  return `[${dispatch.tenantName}] ${entityLabel} ${dispatch.title} (${dispatch.companyName ?? "-"}) - ${dueLabel}`;
}

function computeBackoffSeconds(
  backoffBaseSeconds: number,
  nextAttemptNumber: number,
): number {
  const base = sanitizePositiveInt(backoffBaseSeconds, DEFAULT_BACKOFF_BASE_SECONDS);
  const exponent = Math.max(nextAttemptNumber - 1, 0);
  const computed = base * 2 ** exponent;
  return Math.min(computed, MAX_BACKOFF_SECONDS);
}

function addSeconds(value: Date, seconds: number): Date {
  return new Date(value.getTime() + seconds * 1000);
}

async function postJsonWithTimeout(
  url: string,
  init: Omit<RequestInit, "signal">,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEBHOOK_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function deliverWebhook(
  config: WebhookChannelConfig,
  dispatch: DispatchQueueRecord,
  correlationId: string,
): Promise<void> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (config.bearerToken) {
    headers.authorization = `Bearer ${config.bearerToken}`;
  }

  const response = await postJsonWithTimeout(dispatch.recipient, {
    method: "POST",
    headers,
    body: JSON.stringify({
      event: "expiration_alert",
      correlation_id: correlationId,
      tenant_id: dispatch.tenantId,
      alert: {
        type: dispatch.alertType,
        entity_id: dispatch.entityId,
        title: dispatch.title,
        company_name: dispatch.companyName,
        due_date: dispatch.dueDate,
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`webhook returned ${response.status}${text ? `: ${text}` : ""}`);
  }
}

async function deliverEmail(
  config: EmailChannelConfig,
  dispatch: DispatchQueueRecord,
  now: Date,
): Promise<void> {
  const response = await postJsonWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      from: config.from,
      to: [dispatch.recipient],
      subject: `[SST] Alerta de vencimento: ${dispatch.title}`,
      text: formatDispatchMessage(dispatch, now),
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`resend returned ${response.status}${text ? `: ${text}` : ""}`);
  }
}

async function deliverWhatsApp(
  config: WhatsAppChannelConfig,
  dispatch: DispatchQueueRecord,
  now: Date,
): Promise<void> {
  const response = await postJsonWithTimeout(
    `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.token}`,
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: dispatch.recipient,
        type: "text",
        text: {
          preview_url: false,
          body: formatDispatchMessage(dispatch, now),
        },
      }),
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `whatsapp api returned ${response.status}${text ? `: ${text}` : ""}`,
    );
  }
}

async function deliverDispatch(
  config: ResolvedChannelConfig,
  dispatch: DispatchQueueRecord,
  correlationId: string,
  now: Date,
): Promise<void> {
  switch (config.channel) {
    case "webhook":
      return deliverWebhook(config, dispatch, correlationId);
    case "email":
      return deliverEmail(config, dispatch, now);
    case "whatsapp":
      return deliverWhatsApp(config, dispatch, now);
    default:
      throw new Error(`Unsupported channel`);
  }
}

function resolveInstanceId(): string {
  const host = process.env.HOSTNAME ?? process.env.COMPUTERNAME ?? "local";
  return `${host}:${process.pid}`;
}

export const databaseAlertDispatchRepository: AlertDispatchRepository = {
  async listTenantChannelRecords(tenantIds: string[]): Promise<TenantChannelRecord[]> {
    if (tenantIds.length === 0) {
      return [];
    }

    const uniqueTenantIds = Array.from(new Set(tenantIds));
    const database = await resolveDb();
    const rows = await database
      .select()
      .from(tenantAlertChannels)
      .where(inArray(tenantAlertChannels.tenant_id, uniqueTenantIds));

    const sanitized = rows
      .map((row) => sanitizeChannelRecord(row))
      .filter((row): row is TenantChannelRecord => row !== null);
    return sanitized;
  },

  async enqueueDispatches(
    candidates: EnqueueDispatchCandidate[],
    now: Date,
  ): Promise<{ queued: number; deduplicated: number }> {
    if (candidates.length === 0) {
      return { queued: 0, deduplicated: 0 };
    }

    const database = await resolveDb();
    const nowIso = now.toISOString();
    const inserted = await database
      .insert(alertDispatches)
      .values(
        candidates.map((candidate) => ({
          tenant_id: candidate.tenantId,
          tenant_name: candidate.tenantName,
          channel: candidate.channel,
          recipient: candidate.recipient,
          dedupe_key: candidate.dedupeKey,
          alert_type: candidate.alertType,
          entity_id: candidate.entityId,
          title: candidate.title,
          company_name: candidate.companyName,
          due_date: candidate.dueDate,
          status: "pending",
          attempts: 0,
          max_attempts: candidate.maxAttempts,
          backoff_base_seconds: candidate.backoffBaseSeconds,
          next_attempt_at: nowIso,
          created_correlation_id: candidate.createdCorrelationId,
          last_correlation_id: candidate.createdCorrelationId,
          created_at: nowIso,
          updated_at: nowIso,
        })),
      )
      .onConflictDoNothing({ target: alertDispatches.dedupe_key })
      .returning({ id: alertDispatches.id });

    return {
      queued: inserted.length,
      deduplicated: candidates.length - inserted.length,
    };
  },

  async recoverStaleProcessing(now: Date, staleBefore: Date): Promise<number> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    const staleBeforeIso = staleBefore.toISOString();

    const recovered = await database
      .update(alertDispatches)
      .set({
        status: "pending",
        processing_by: null,
        processing_started_at: null,
        next_attempt_at: nowIso,
        updated_at: nowIso,
      })
      .where(
        and(
          eq(alertDispatches.status, "processing"),
          or(
            isNull(alertDispatches.processing_started_at),
            lt(alertDispatches.processing_started_at, staleBeforeIso),
          ),
        ),
      )
      .returning({ id: alertDispatches.id });

    return recovered.length;
  },

  async listDueDispatches(
    channel: AlertChannelName,
    now: Date,
    limit: number,
  ): Promise<DispatchQueueRecord[]> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    const rows = await database
      .select({
        id: alertDispatches.id,
        tenantId: alertDispatches.tenant_id,
        tenantName: alertDispatches.tenant_name,
        channel: alertDispatches.channel,
        recipient: alertDispatches.recipient,
        alertType: alertDispatches.alert_type,
        entityId: alertDispatches.entity_id,
        title: alertDispatches.title,
        companyName: alertDispatches.company_name,
        dueDate: alertDispatches.due_date,
        attempts: alertDispatches.attempts,
        maxAttempts: alertDispatches.max_attempts,
        backoffBaseSeconds: alertDispatches.backoff_base_seconds,
      })
      .from(alertDispatches)
      .where(
        and(
          eq(alertDispatches.channel, channel),
          eq(alertDispatches.status, "pending"),
          lte(alertDispatches.next_attempt_at, nowIso),
        ),
      )
      .orderBy(asc(alertDispatches.next_attempt_at))
      .limit(limit);

    return rows.filter((row): row is DispatchQueueRecord =>
      isAlertChannelName(row.channel),
    );
  },
  async claimDispatch(
    id: string,
    now: Date,
    instanceId: string,
    correlationId: string,
  ): Promise<DispatchQueueRecord | null> {
    const database = await resolveDb();
    const nowIso = now.toISOString();

    const [row] = await database
      .update(alertDispatches)
      .set({
        status: "processing",
        processing_by: instanceId,
        processing_started_at: nowIso,
        last_correlation_id: correlationId,
        updated_at: nowIso,
      })
      .where(
        and(
          eq(alertDispatches.id, id),
          eq(alertDispatches.status, "pending"),
          lte(alertDispatches.next_attempt_at, nowIso),
        ),
      )
      .returning({
        id: alertDispatches.id,
        tenantId: alertDispatches.tenant_id,
        tenantName: alertDispatches.tenant_name,
        channel: alertDispatches.channel,
        recipient: alertDispatches.recipient,
        alertType: alertDispatches.alert_type,
        entityId: alertDispatches.entity_id,
        title: alertDispatches.title,
        companyName: alertDispatches.company_name,
        dueDate: alertDispatches.due_date,
        attempts: alertDispatches.attempts,
        maxAttempts: alertDispatches.max_attempts,
        backoffBaseSeconds: alertDispatches.backoff_base_seconds,
      });

    if (!row || !isAlertChannelName(row.channel)) {
      return null;
    }
    return { ...row, channel: row.channel };
  },

  async markDispatchSent(
    id: string,
    now: Date,
    instanceId: string,
    correlationId: string,
  ): Promise<void> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    await database
      .update(alertDispatches)
      .set({
        status: "sent",
        attempts: sql`${alertDispatches.attempts} + 1`,
        sent_at: nowIso,
        processing_by: null,
        processing_started_at: null,
        last_error: null,
        last_correlation_id: correlationId,
        updated_at: nowIso,
      })
      .where(
        and(
          eq(alertDispatches.id, id),
          eq(alertDispatches.status, "processing"),
          eq(alertDispatches.processing_by, instanceId),
        ),
      );
  },

  async markDispatchRetry(
    id: string,
    now: Date,
    nextAttemptAt: Date,
    error: string,
    instanceId: string,
    correlationId: string,
  ): Promise<void> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    await database
      .update(alertDispatches)
      .set({
        status: "pending",
        attempts: sql`${alertDispatches.attempts} + 1`,
        next_attempt_at: nextAttemptAt.toISOString(),
        processing_by: null,
        processing_started_at: null,
        last_error: error,
        last_correlation_id: correlationId,
        updated_at: nowIso,
      })
      .where(
        and(
          eq(alertDispatches.id, id),
          eq(alertDispatches.status, "processing"),
          eq(alertDispatches.processing_by, instanceId),
        ),
      );
  },

  async markDispatchFailed(
    id: string,
    now: Date,
    error: string,
    instanceId: string,
    correlationId: string,
  ): Promise<void> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    await database
      .update(alertDispatches)
      .set({
        status: "failed",
        attempts: sql`${alertDispatches.attempts} + 1`,
        processing_by: null,
        processing_started_at: null,
        last_error: error,
        last_correlation_id: correlationId,
        updated_at: nowIso,
      })
      .where(
        and(
          eq(alertDispatches.id, id),
          eq(alertDispatches.status, "processing"),
          eq(alertDispatches.processing_by, instanceId),
        ),
      );
  },

  async recordRunMetrics(record: RunMetricsRecord): Promise<void> {
    const database = await resolveDb();
    await database
      .insert(alertJobRuns)
      .values({
        correlation_id: record.correlationId,
        job_name: "expiration_alerts",
        instance_id: record.instanceId,
        executed_at: record.executedAt,
        tenants_evaluated: record.tenantsEvaluated,
        alerts_found: record.alertsFound,
        queued: record.queued,
        deduplicated: record.deduplicated,
        stale_recovered: record.staleRecovered,
        attempted: record.attempted,
        delivered: record.delivered,
        failed: record.failed,
        retried: record.retried,
      })
      .onConflictDoNothing({ target: alertJobRuns.correlation_id });
  },
};

export type AlertDispatchMetrics = {
  queued: number;
  deduplicated: number;
  staleRecovered: number;
  attempted: number;
  delivered: number;
  failed: number;
  retried: number;
  rateLimited: number;
};

export type AlertDispatchReport = {
  correlationId: string;
  attemptedChannels: string[];
  deliveredChannels: string[];
  failedChannels: Array<{ channel: string; error: string }>;
  skippedChannels: string[];
  metrics: AlertDispatchMetrics;
};

type DispatchOptions = {
  logger?: JobLogger;
  repository?: AlertDispatchRepository;
  correlationId?: string;
  instanceId?: string;
  now?: Date;
};

function buildTenantChannelConfig(
  tenantId: string,
  tenantRecords: TenantChannelRecord[],
  logger: JobLogger,
  correlationId: string,
): TenantChannelConfigMap {
  const result: TenantChannelConfigMap = {};
  const explicitByChannel = new Map<AlertChannelName, TenantChannelRecord>();

  for (const record of tenantRecords) {
    explicitByChannel.set(record.channel, record);
  }

  for (const channel of ALERT_CHANNELS) {
    const explicit = explicitByChannel.get(channel);
    if (explicit) {
      const resolved = resolveChannelConfigFromRecord(explicit);
      if (!resolved && explicit.enabled) {
        logger.warn(
          `[JOB][expiration-alerts] correlation_id=${correlationId} invalid ${channel} config for tenant=${tenantId}; channel will be skipped`,
        );
      } else if (resolved) {
        result[channel] = resolved;
      }
      continue;
    }

    const fallback = resolveGlobalChannelConfig(channel, tenantId);
    if (fallback) {
      result[channel] = fallback;
    }
  }

  return result;
}

function buildDispatchCandidates(
  jobResult: ExpirationAlertJobResult,
  configByTenant: Map<string, TenantChannelConfigMap>,
  correlationId: string,
): EnqueueDispatchCandidate[] {
  const candidates: EnqueueDispatchCandidate[] = [];

  for (const alert of jobResult.alerts) {
    const tenantConfig = configByTenant.get(alert.tenantId);
    if (!tenantConfig) {
      continue;
    }

    for (const channel of ALERT_CHANNELS) {
      const channelConfig = tenantConfig[channel];
      if (!channelConfig) {
        continue;
      }

      const recipients = resolveRecipients(channelConfig);
      for (const recipient of recipients) {
        candidates.push({
          tenantId: alert.tenantId,
          tenantName: alert.tenantName,
          channel,
          recipient,
          dedupeKey: buildDedupeKey(alert, channel, recipient),
          alertType: alert.type,
          entityId: alert.entityId,
          title: alert.title,
          companyName: alert.companyName,
          dueDate: alert.dueDate,
          maxAttempts: channelConfig.maxRetries,
          backoffBaseSeconds: channelConfig.backoffBaseSeconds,
          createdCorrelationId: correlationId,
        });
      }
    }
  }

  return candidates;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function createEmptyMetrics(): AlertDispatchMetrics {
  return {
    queued: 0,
    deduplicated: 0,
    staleRecovered: 0,
    attempted: 0,
    delivered: 0,
    failed: 0,
    retried: 0,
    rateLimited: 0,
  };
}

export async function dispatchExpirationAlerts(
  jobResult: ExpirationAlertJobResult,
  options: DispatchOptions = {},
): Promise<AlertDispatchReport> {
  const logger = options.logger ?? console;
  const repository = options.repository ?? databaseAlertDispatchRepository;
  const now = options.now ?? new Date();
  const correlationId =
    options.correlationId ?? jobResult.correlationId ?? randomUUID();
  const instanceId = options.instanceId ?? resolveInstanceId();

  const report: AlertDispatchReport = {
    correlationId,
    attemptedChannels: [],
    deliveredChannels: [],
    failedChannels: [],
    skippedChannels: [],
    metrics: createEmptyMetrics(),
  };

  const attemptedChannels = new Set<string>();
  const deliveredChannels = new Set<string>();
  const channelErrors = new Map<string, string>();
  const configByTenant = new Map<string, TenantChannelConfigMap>();

  const ensureTenantConfigs = async (tenantIds: string[]): Promise<void> => {
    const missing = uniqueStrings(tenantIds).filter(
      (tenantId) => !configByTenant.has(tenantId),
    );
    if (missing.length === 0) {
      return;
    }

    const rows = await repository.listTenantChannelRecords(missing);
    const grouped = new Map<string, TenantChannelRecord[]>();
    for (const row of rows) {
      const existing = grouped.get(row.tenantId);
      if (existing) {
        existing.push(row);
      } else {
        grouped.set(row.tenantId, [row]);
      }
    }

    for (const tenantId of missing) {
      const tenantRows = grouped.get(tenantId) ?? [];
      configByTenant.set(
        tenantId,
        buildTenantChannelConfig(tenantId, tenantRows, logger, correlationId),
      );
    }
  };

  const tenantIdsFromAlerts = uniqueStrings(jobResult.alerts.map((alert) => alert.tenantId));
  await ensureTenantConfigs(tenantIdsFromAlerts);

  const enqueueCandidates = buildDispatchCandidates(
    jobResult,
    configByTenant,
    correlationId,
  );
  const enqueueResult = await repository.enqueueDispatches(enqueueCandidates, now);
  report.metrics.queued = enqueueResult.queued;
  report.metrics.deduplicated = enqueueResult.deduplicated;

  const staleBefore = new Date(now.getTime() - STALE_PROCESSING_WINDOW_MS);
  report.metrics.staleRecovered = await repository.recoverStaleProcessing(
    now,
    staleBefore,
  );

  for (const channel of ALERT_CHANNELS) {
    const dueRows = await repository.listDueDispatches(channel, now, MAX_DUE_BATCH);
    if (dueRows.length === 0) {
      report.skippedChannels.push(channel);
      continue;
    }

    attemptedChannels.add(channel);
    await ensureTenantConfigs(dueRows.map((row) => row.tenantId));

    const tenantProcessedCount = new Map<string, number>();

    for (const row of dueRows) {
      const tenantConfig = configByTenant.get(row.tenantId)?.[channel];
      const processedCount = tenantProcessedCount.get(row.tenantId) ?? 0;
      const maxPerRun = tenantConfig?.maxPerRun ?? DEFAULT_MAX_PER_RUN;

      if (processedCount >= maxPerRun) {
        report.metrics.rateLimited += 1;
        continue;
      }

      const claimed = await repository.claimDispatch(
        row.id,
        now,
        instanceId,
        correlationId,
      );
      if (!claimed) {
        continue;
      }

      tenantProcessedCount.set(row.tenantId, processedCount + 1);

      if (!tenantConfig) {
        const errorMessage = `channel ${channel} not configured for tenant=${row.tenantId}`;
        channelErrors.set(channel, errorMessage);
        const nextAttemptNumber = claimed.attempts + 1;
        if (nextAttemptNumber >= claimed.maxAttempts) {
          report.metrics.failed += 1;
          await repository.markDispatchFailed(
            claimed.id,
            now,
            errorMessage,
            instanceId,
            correlationId,
          );
        } else {
          report.metrics.retried += 1;
          const delaySeconds = computeBackoffSeconds(
            claimed.backoffBaseSeconds,
            nextAttemptNumber,
          );
          await repository.markDispatchRetry(
            claimed.id,
            now,
            addSeconds(now, delaySeconds),
            errorMessage,
            instanceId,
            correlationId,
          );
        }

        logger.error(
          `[JOB][expiration-alerts] correlation_id=${correlationId} ${errorMessage} dispatch=${claimed.id}`,
        );
        continue;
      }

      report.metrics.attempted += 1;
      try {
        await deliverDispatch(tenantConfig, claimed, correlationId, now);
        await repository.markDispatchSent(
          claimed.id,
          now,
          instanceId,
          correlationId,
        );
        report.metrics.delivered += 1;
        deliveredChannels.add(channel);
        logger.info(
          `[JOB][expiration-alerts] correlation_id=${correlationId} delivered channel=${channel} tenant=${claimed.tenantId} dispatch=${claimed.id}`,
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        channelErrors.set(channel, errorMessage);

        const nextAttemptNumber = claimed.attempts + 1;
        if (nextAttemptNumber >= claimed.maxAttempts) {
          report.metrics.failed += 1;
          await repository.markDispatchFailed(
            claimed.id,
            now,
            errorMessage,
            instanceId,
            correlationId,
          );
        } else {
          report.metrics.retried += 1;
          const delaySeconds = computeBackoffSeconds(
            claimed.backoffBaseSeconds,
            nextAttemptNumber,
          );
          await repository.markDispatchRetry(
            claimed.id,
            now,
            addSeconds(now, delaySeconds),
            errorMessage,
            instanceId,
            correlationId,
          );
        }

        logger.error(
          `[JOB][expiration-alerts] correlation_id=${correlationId} failed channel=${channel} tenant=${claimed.tenantId} dispatch=${claimed.id}: ${errorMessage}`,
        );
      }
    }
  }

  report.attemptedChannels = Array.from(attemptedChannels);
  report.deliveredChannels = Array.from(deliveredChannels);
  report.failedChannels = Array.from(channelErrors.entries()).map(([channel, error]) => ({
    channel,
    error,
  }));

  if (report.attemptedChannels.length === 0) {
    logger.info(
      `[JOB][expiration-alerts] correlation_id=${correlationId} no pending dispatches for delivery`,
    );
  }

  try {
    await repository.recordRunMetrics({
      correlationId,
      instanceId,
      executedAt: jobResult.executedAt,
      tenantsEvaluated: jobResult.tenantsEvaluated,
      alertsFound: jobResult.alerts.length,
      queued: report.metrics.queued,
      deduplicated: report.metrics.deduplicated,
      staleRecovered: report.metrics.staleRecovered,
      attempted: report.metrics.attempted,
      delivered: report.metrics.delivered,
      failed: report.metrics.failed,
      retried: report.metrics.retried,
    });
  } catch (error) {
    logger.error(
      `[JOB][expiration-alerts] correlation_id=${correlationId} failed to persist metrics: ${String(error)}`,
    );
  }

  logger.info(
    `[JOB][expiration-alerts] correlation_id=${correlationId} metrics queued=${report.metrics.queued} deduplicated=${report.metrics.deduplicated} stale_recovered=${report.metrics.staleRecovered} attempted=${report.metrics.attempted} delivered=${report.metrics.delivered} failed=${report.metrics.failed} retried=${report.metrics.retried} rate_limited=${report.metrics.rateLimited}`,
  );

  return report;
}
