CREATE TABLE "alert_dispatches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"tenant_name" text NOT NULL,
	"channel" text NOT NULL,
	"recipient" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"alert_type" text NOT NULL,
	"entity_id" varchar NOT NULL,
	"title" text NOT NULL,
	"company_name" text,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"backoff_base_seconds" integer DEFAULT 60 NOT NULL,
	"next_attempt_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processing_by" text,
	"processing_started_at" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"last_error" text,
	"created_correlation_id" text NOT NULL,
	"last_correlation_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "alert_job_runs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"correlation_id" text NOT NULL,
	"job_name" text DEFAULT 'expiration_alerts' NOT NULL,
	"instance_id" text NOT NULL,
	"executed_at" timestamp with time zone NOT NULL,
	"tenants_evaluated" integer DEFAULT 0 NOT NULL,
	"alerts_found" integer DEFAULT 0 NOT NULL,
	"queued" integer DEFAULT 0 NOT NULL,
	"deduplicated" integer DEFAULT 0 NOT NULL,
	"stale_recovered" integer DEFAULT 0 NOT NULL,
	"attempted" integer DEFAULT 0 NOT NULL,
	"delivered" integer DEFAULT 0 NOT NULL,
	"failed" integer DEFAULT 0 NOT NULL,
	"retried" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_locks" (
	"job_name" text PRIMARY KEY NOT NULL,
	"lock_owner" text NOT NULL,
	"locked_until" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenant_alert_channels" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" varchar NOT NULL,
	"channel" text NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"max_retries" integer DEFAULT 3 NOT NULL,
	"max_per_run" integer DEFAULT 50 NOT NULL,
	"backoff_base_seconds" integer DEFAULT 60 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "alert_dispatches" ADD CONSTRAINT "alert_dispatches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_alert_channels" ADD CONSTRAINT "tenant_alert_channels_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "alert_dispatches_dedupe_unique" ON "alert_dispatches" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "alert_dispatches_status_next_attempt_idx" ON "alert_dispatches" USING btree ("status","next_attempt_at");--> statement-breakpoint
CREATE INDEX "alert_dispatches_channel_status_idx" ON "alert_dispatches" USING btree ("channel","status");--> statement-breakpoint
CREATE INDEX "alert_dispatches_tenant_idx" ON "alert_dispatches" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "alert_job_runs_correlation_unique" ON "alert_job_runs" USING btree ("correlation_id");--> statement-breakpoint
CREATE INDEX "alert_job_runs_created_at_idx" ON "alert_job_runs" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_alert_channels_tenant_channel_unique" ON "tenant_alert_channels" USING btree ("tenant_id","channel");--> statement-breakpoint
CREATE INDEX "tenant_alert_channels_tenant_idx" ON "tenant_alert_channels" USING btree ("tenant_id");