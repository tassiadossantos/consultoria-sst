CREATE TABLE "companies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"trade_name" text,
	"cnpj" text,
	"cnae" text,
	"address" text,
	"employees" integer,
	"risk_level" integer,
	"legal_responsible" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_cnpj_unique" UNIQUE("cnpj")
);
--> statement-breakpoint
CREATE TABLE "pgr_actions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pgr_id" varchar NOT NULL,
	"action" text,
	"owner" text,
	"due_date" date,
	"status" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pgr_risks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"pgr_id" varchar NOT NULL,
	"sector" text,
	"role" text,
	"activity" text,
	"hazard" text,
	"risk" text,
	"risk_type" text,
	"probability" integer,
	"severity" integer,
	"risk_score" integer,
	"risk_level" text,
	"controls" text,
	"epi" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pgrs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"revision" integer DEFAULT 0 NOT NULL,
	"valid_until" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"characterization" text,
	"responsibilities" text,
	"risk_criteria" text,
	"control_measures" text,
	"training_plan" text,
	"monitoring" text,
	"responsible_name" text,
	"responsible_registry" text,
	"progress" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_name" text,
	"company_cnpj" text,
	"company_email" text,
	"password_policy" text,
	"token_expiration" integer,
	"training_frequency" text,
	"alert_days" integer
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" varchar,
	"title" text NOT NULL,
	"training_date" date NOT NULL,
	"instructor" text,
	"participants_label" text,
	"participants_count" integer,
	"status" text DEFAULT 'agendado' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "pgr_actions" ADD CONSTRAINT "pgr_actions_pgr_id_pgrs_id_fk" FOREIGN KEY ("pgr_id") REFERENCES "public"."pgrs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pgr_risks" ADD CONSTRAINT "pgr_risks_pgr_id_pgrs_id_fk" FOREIGN KEY ("pgr_id") REFERENCES "public"."pgrs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pgrs" ADD CONSTRAINT "pgrs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trainings" ADD CONSTRAINT "trainings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE set null ON UPDATE no action;