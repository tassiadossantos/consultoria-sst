import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const pgrStatusValues = [
  "draft",
  "active",
  "expired",
  "pending_review",
] as const;

export const trainingStatusValues = [
  "agendado",
  "realizado",
  "vencendo",
  "vencido",
] as const;

export const riskTypeValues = [
  "fisico",
  "quimico",
  "biologico",
  "ergonomico",
  "acidente",
] as const;

export const actionStatusValues = [
  "PENDENTE",
  "EM_ANDAMENTO",
  "CONCLUIDO",
  "CANCELADO",
] as const;

export const pgrRiskLevelValues = ["Baixo", "Médio", "Alto"] as const;
export const alertChannelValues = ["webhook", "email", "whatsapp"] as const;
export const alertDispatchStatusValues = [
  "pending",
  "processing",
  "sent",
  "failed",
] as const;

export const pgrStatusSchema = z.enum(pgrStatusValues);
export const trainingStatusSchema = z.enum(trainingStatusValues);
export const riskTypeSchema = z.enum(riskTypeValues);
export const actionStatusSchema = z.enum(actionStatusValues);
export const pgrRiskLevelSchema = z.enum(pgrRiskLevelValues);
export const alertChannelSchema = z.enum(alertChannelValues);
export const alertDispatchStatusSchema = z.enum(alertDispatchStatusValues);
export const riskScaleSchema = z.coerce.number().int().min(1).max(5);
export const companyRiskLevelSchema = z.coerce.number().int().min(1).max(4);

export const tenants = pgTable("tenants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: varchar("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: varchar("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" })
    .unique(),
  company_name: text("company_name"),
  company_cnpj: text("company_cnpj"),
  company_email: text("company_email"),
  password_policy: text("password_policy"),
  token_expiration: integer("token_expiration"),
  training_frequency: text("training_frequency"),
  alert_days: integer("alert_days"),
});

export const companies = pgTable(
  "companies",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenant_id: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    trade_name: text("trade_name"),
    cnpj: text("cnpj"),
    cnae: text("cnae"),
    address: text("address"),
    employees: integer("employees"),
    risk_level: integer("risk_level"),
    legal_responsible: text("legal_responsible"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    tenantCnpjUnique: uniqueIndex("companies_tenant_cnpj_unique").on(
      table.tenant_id,
      table.cnpj,
    ),
  }),
);

export const pgrs = pgTable("pgrs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: varchar("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  company_id: varchar("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("draft"),
  revision: integer("revision").notNull().default(0),
  valid_until: date("valid_until", { mode: "string" }),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  characterization: text("characterization"),
  responsibilities: text("responsibilities"),
  risk_criteria: text("risk_criteria"),
  control_measures: text("control_measures"),
  training_plan: text("training_plan"),
  monitoring: text("monitoring"),
  responsible_name: text("responsible_name"),
  responsible_registry: text("responsible_registry"),
  progress: integer("progress").default(0),
});

export const pgrRisks = pgTable("pgr_risks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: varchar("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  pgr_id: varchar("pgr_id")
    .notNull()
    .references(() => pgrs.id, { onDelete: "cascade" }),
  sector: text("sector"),
  role: text("role"),
  activity: text("activity"),
  hazard: text("hazard"),
  risk: text("risk"),
  risk_type: text("risk_type"),
  probability: integer("probability"),
  severity: integer("severity"),
  risk_score: integer("risk_score"),
  risk_level: text("risk_level"),
  controls: text("controls"),
  epi: text("epi"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const pgrActions = pgTable("pgr_actions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: varchar("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  pgr_id: varchar("pgr_id")
    .notNull()
    .references(() => pgrs.id, { onDelete: "cascade" }),
  action: text("action"),
  owner: text("owner"),
  due_date: date("due_date", { mode: "string" }),
  status: text("status"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const trainings = pgTable("trainings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tenant_id: varchar("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  company_id: varchar("company_id").references(() => companies.id, {
    onDelete: "set null",
  }),
  title: text("title").notNull(),
  training_date: date("training_date", { mode: "string" }).notNull(),
  instructor: text("instructor"),
  participants_label: text("participants_label"),
  participants_count: integer("participants_count"),
  status: text("status").notNull().default("agendado"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }),
});

export const tenantAlertChannels = pgTable(
  "tenant_alert_channels",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenant_id: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    enabled: boolean("enabled").notNull().default(false),
    config: jsonb("config")
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    max_retries: integer("max_retries").notNull().default(3),
    max_per_run: integer("max_per_run").notNull().default(50),
    backoff_base_seconds: integer("backoff_base_seconds")
      .notNull()
      .default(60),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" }),
  },
  (table) => ({
    tenantChannelUnique: uniqueIndex(
      "tenant_alert_channels_tenant_channel_unique",
    ).on(table.tenant_id, table.channel),
    tenantIdx: index("tenant_alert_channels_tenant_idx").on(table.tenant_id),
  }),
);

export const alertDispatches = pgTable(
  "alert_dispatches",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    tenant_id: varchar("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    tenant_name: text("tenant_name").notNull(),
    channel: text("channel").notNull(),
    recipient: text("recipient").notNull(),
    dedupe_key: text("dedupe_key").notNull(),
    alert_type: text("alert_type").notNull(),
    entity_id: varchar("entity_id").notNull(),
    title: text("title").notNull(),
    company_name: text("company_name"),
    due_date: date("due_date", { mode: "string" }).notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    max_attempts: integer("max_attempts").notNull().default(3),
    backoff_base_seconds: integer("backoff_base_seconds")
      .notNull()
      .default(60),
    next_attempt_at: timestamp("next_attempt_at", {
      withTimezone: true,
      mode: "string",
    })
      .defaultNow()
      .notNull(),
    processing_by: text("processing_by"),
    processing_started_at: timestamp("processing_started_at", {
      withTimezone: true,
      mode: "string",
    }),
    sent_at: timestamp("sent_at", { withTimezone: true, mode: "string" }),
    last_error: text("last_error"),
    created_correlation_id: text("created_correlation_id").notNull(),
    last_correlation_id: text("last_correlation_id"),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    dedupeUnique: uniqueIndex("alert_dispatches_dedupe_unique").on(
      table.dedupe_key,
    ),
    statusNextAttemptIdx: index("alert_dispatches_status_next_attempt_idx").on(
      table.status,
      table.next_attempt_at,
    ),
    channelStatusIdx: index("alert_dispatches_channel_status_idx").on(
      table.channel,
      table.status,
    ),
    tenantIdx: index("alert_dispatches_tenant_idx").on(table.tenant_id),
  }),
);

export const jobLocks = pgTable("job_locks", {
  job_name: text("job_name").primaryKey(),
  lock_owner: text("lock_owner").notNull(),
  locked_until: timestamp("locked_until", {
    withTimezone: true,
    mode: "string",
  }).notNull(),
  updated_at: timestamp("updated_at", { withTimezone: true, mode: "string" })
    .defaultNow()
    .notNull(),
});

export const alertJobRuns = pgTable(
  "alert_job_runs",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    correlation_id: text("correlation_id").notNull(),
    job_name: text("job_name").notNull().default("expiration_alerts"),
    instance_id: text("instance_id").notNull(),
    executed_at: timestamp("executed_at", {
      withTimezone: true,
      mode: "string",
    }).notNull(),
    tenants_evaluated: integer("tenants_evaluated").notNull().default(0),
    alerts_found: integer("alerts_found").notNull().default(0),
    queued: integer("queued").notNull().default(0),
    deduplicated: integer("deduplicated").notNull().default(0),
    stale_recovered: integer("stale_recovered").notNull().default(0),
    attempted: integer("attempted").notNull().default(0),
    delivered: integer("delivered").notNull().default(0),
    failed: integer("failed").notNull().default(0),
    retried: integer("retried").notNull().default(0),
    created_at: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    correlationUnique: uniqueIndex("alert_job_runs_correlation_unique").on(
      table.correlation_id,
    ),
    createdAtIdx: index("alert_job_runs_created_at_idx").on(table.created_at),
  }),
);

export const settingsSchema = z.object({
  company_name: z.string().min(1),
  company_cnpj: z.string().min(14),
  company_email: z.string().email(),
  password_policy: z.enum(["8", "10", "12"]),
  token_expiration: z.enum(["30", "60", "120"]).transform(Number),
  training_frequency: z.enum(["Mensal", "Trimestral", "Semestral", "Anual"]),
  alert_days: z.enum(["7", "15", "30"]).transform(Number),
});

export const insertUserSchema = createInsertSchema(users).pick({
  tenant_id: true,
  username: true,
  password: true,
  role: true,
});

export const tenantSchema = createSelectSchema(tenants);
export const companySchema = createSelectSchema(companies);
export const pgrSchema = createSelectSchema(pgrs).extend({
  status: pgrStatusSchema,
});
export const pgrRiskSchema = createSelectSchema(pgrRisks);
export const pgrActionSchema = createSelectSchema(pgrActions);
export const trainingSchema = createSelectSchema(trainings).extend({
  status: trainingStatusSchema,
});

export const insertCompanySchema = createInsertSchema(companies).omit({
  id: true,
  tenant_id: true,
  created_at: true,
});

export const updateCompanySchema = insertCompanySchema.partial();

const insertPgrBaseSchema = createInsertSchema(pgrs).omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});

export const insertPgrSchema = insertPgrBaseSchema.extend({
  status: pgrStatusSchema.optional().default("draft"),
});

export const updatePgrSchema = insertPgrSchema.partial();

export const insertPgrRiskSchema = createInsertSchema(pgrRisks)
  .omit({
    id: true,
    tenant_id: true,
    created_at: true,
  })
  .extend({
    risk_type: riskTypeSchema.nullish(),
    probability: riskScaleSchema.nullish(),
    severity: riskScaleSchema.nullish(),
    risk_score: z.coerce.number().int().min(1).max(25).nullish(),
    risk_level: pgrRiskLevelSchema.nullish(),
  });

export const updatePgrRiskSchema = insertPgrRiskSchema.partial();

export const insertPgrActionSchema = createInsertSchema(pgrActions)
  .omit({
    id: true,
    tenant_id: true,
    created_at: true,
  })
  .extend({
    status: actionStatusSchema.nullish(),
  });

export const updatePgrActionSchema = insertPgrActionSchema.partial();

const insertTrainingBaseSchema = createInsertSchema(trainings).omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
});

export const insertTrainingSchema = insertTrainingBaseSchema.extend({
  status: trainingStatusSchema.optional().default("agendado"),
});

export const updateTrainingSchema = insertTrainingSchema.partial();

export const createPgrPayloadSchema = z.object({
  company: insertCompanySchema,
  pgr: insertPgrSchema.omit({ company_id: true }),
  risks: insertPgrRiskSchema.omit({ pgr_id: true }).array().default([]),
  actions: insertPgrActionSchema.omit({ pgr_id: true }).array().default([]),
});

export const updatePgrPayloadSchema = createPgrPayloadSchema.extend({
  pgrId: z.string().min(1),
  companyId: z.string().min(1),
});

export const pgrListItemSchema = z.object({
  id: z.string(),
  status: pgrStatusSchema,
  revision: z.number().int(),
  valid_until: z.string().nullable(),
  created_at: z.string(),
  progress: z.number().int().nullable(),
  company: companySchema
    .pick({
      id: true,
      name: true,
      cnpj: true,
    })
    .nullable(),
});

export const pgrDetailSchema = z.object({
  pgr: pgrSchema,
  company: companySchema.nullable(),
  risks: pgrRiskSchema.array(),
  actions: pgrActionSchema.array(),
});

export const sstEntitiesSchema = z.object({
  company: companySchema,
  pgr: pgrSchema,
  risk: pgrRiskSchema,
  action: pgrActionSchema,
  training: trainingSchema,
});

export type Tenant = typeof tenants.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type PgrStatus = z.infer<typeof pgrStatusSchema>;
export type TrainingStatus = z.infer<typeof trainingStatusSchema>;
export type RiskType = z.infer<typeof riskTypeSchema>;
export type ActionStatus = z.infer<typeof actionStatusSchema>;
export type PgrRiskLevel = z.infer<typeof pgrRiskLevelSchema>;
export type AlertChannel = z.infer<typeof alertChannelSchema>;
export type AlertDispatchStatus = z.infer<typeof alertDispatchStatusSchema>;

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type UpdateCompany = z.infer<typeof updateCompanySchema>;

export type TenantAlertChannel = typeof tenantAlertChannels.$inferSelect;
export type AlertDispatch = typeof alertDispatches.$inferSelect;
export type JobLock = typeof jobLocks.$inferSelect;
export type AlertJobRun = typeof alertJobRuns.$inferSelect;

export type Pgr = z.infer<typeof pgrSchema>;
export type InsertPgr = z.infer<typeof insertPgrSchema>;
export type UpdatePgr = z.infer<typeof updatePgrSchema>;

export type PgrRisk = typeof pgrRisks.$inferSelect;
export type InsertPgrRisk = z.infer<typeof insertPgrRiskSchema>;
export type UpdatePgrRisk = z.infer<typeof updatePgrRiskSchema>;

export type PgrAction = typeof pgrActions.$inferSelect;
export type InsertPgrAction = z.infer<typeof insertPgrActionSchema>;
export type UpdatePgrAction = z.infer<typeof updatePgrActionSchema>;

export type Training = z.infer<typeof trainingSchema>;
export type InsertTraining = z.infer<typeof insertTrainingSchema>;
export type UpdateTraining = z.infer<typeof updateTrainingSchema>;

export type CreatePgrPayload = z.infer<typeof createPgrPayloadSchema>;
export type UpdatePgrPayload = z.infer<typeof updatePgrPayloadSchema>;

export type PgrListItem = z.infer<typeof pgrListItemSchema>;
export type PgrDetail = z.infer<typeof pgrDetailSchema>;
export type SstEntities = z.infer<typeof sstEntitiesSchema>;
