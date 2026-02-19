CREATE TABLE IF NOT EXISTS "tenants" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_cnpj_unique";
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
ALTER TABLE "pgr_actions" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
ALTER TABLE "pgr_risks" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
ALTER TABLE "pgrs" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
ALTER TABLE "trainings" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "tenant_id" varchar;
--> statement-breakpoint
DO $$
DECLARE
	v_tenant_id varchar;
BEGIN
	SELECT id INTO v_tenant_id
	FROM tenants
	ORDER BY created_at ASC
	LIMIT 1;

	IF v_tenant_id IS NULL THEN
		INSERT INTO tenants (name)
		VALUES ('Legacy Tenant')
		RETURNING id INTO v_tenant_id;
	END IF;

	UPDATE companies
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;

	UPDATE pgrs AS p
	SET tenant_id = COALESCE(p.tenant_id, c.tenant_id, v_tenant_id)
	FROM companies AS c
	WHERE p.company_id = c.id
	  AND p.tenant_id IS NULL;

	UPDATE pgrs
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;

	UPDATE pgr_risks AS r
	SET tenant_id = COALESCE(r.tenant_id, p.tenant_id, v_tenant_id)
	FROM pgrs AS p
	WHERE r.pgr_id = p.id
	  AND r.tenant_id IS NULL;

	UPDATE pgr_risks
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;

	UPDATE pgr_actions AS a
	SET tenant_id = COALESCE(a.tenant_id, p.tenant_id, v_tenant_id)
	FROM pgrs AS p
	WHERE a.pgr_id = p.id
	  AND a.tenant_id IS NULL;

	UPDATE pgr_actions
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;

	UPDATE trainings AS t
	SET tenant_id = COALESCE(t.tenant_id, c.tenant_id, v_tenant_id)
	FROM companies AS c
	WHERE t.company_id = c.id
	  AND t.tenant_id IS NULL;

	UPDATE trainings
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;

	UPDATE users
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;

	UPDATE settings
	SET tenant_id = v_tenant_id
	WHERE tenant_id IS NULL;
END $$;
--> statement-breakpoint
WITH ranked_settings AS (
	SELECT
		id,
		ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY id) AS rn
	FROM settings
)
DELETE FROM settings AS s
USING ranked_settings AS rs
WHERE s.id = rs.id
  AND rs.rn > 1;
--> statement-breakpoint
ALTER TABLE "companies" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "pgr_actions" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "pgr_risks" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "pgrs" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "settings" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "trainings" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "tenant_id" SET NOT NULL;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'companies_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "companies"
		ADD CONSTRAINT "companies_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'pgr_actions_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "pgr_actions"
		ADD CONSTRAINT "pgr_actions_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'pgr_risks_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "pgr_risks"
		ADD CONSTRAINT "pgr_risks_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'pgrs_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "pgrs"
		ADD CONSTRAINT "pgrs_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'settings_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "settings"
		ADD CONSTRAINT "settings_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'trainings_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "trainings"
		ADD CONSTRAINT "trainings_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'users_tenant_id_tenants_id_fk'
	) THEN
		ALTER TABLE "users"
		ADD CONSTRAINT "users_tenant_id_tenants_id_fk"
		FOREIGN KEY ("tenant_id")
		REFERENCES "public"."tenants"("id")
		ON DELETE cascade ON UPDATE no action;
	END IF;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "companies_tenant_cnpj_unique"
ON "companies" USING btree ("tenant_id","cnpj");
--> statement-breakpoint
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'settings_tenant_id_unique'
	) THEN
		ALTER TABLE "settings"
		ADD CONSTRAINT "settings_tenant_id_unique" UNIQUE("tenant_id");
	END IF;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "companies_tenant_id_idx" ON "companies" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pgrs_tenant_id_idx" ON "pgrs" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pgr_risks_tenant_id_idx" ON "pgr_risks" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pgr_actions_tenant_id_idx" ON "pgr_actions" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "trainings_tenant_id_idx" ON "trainings" ("tenant_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_tenant_id_idx" ON "users" ("tenant_id");
--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS varchar
LANGUAGE sql
STABLE
AS $$
	SELECT COALESCE(
		NULLIF((NULLIF(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tenant_id'), ''),
		NULLIF(current_setting('app.current_tenant_id', true), '')
	)::varchar;
$$;
--> statement-breakpoint
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pgrs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pgr_risks" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "pgr_actions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "trainings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_companies" ON "companies";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_companies"
ON "companies"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_pgrs" ON "pgrs";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_pgrs"
ON "pgrs"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_pgr_risks" ON "pgr_risks";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_pgr_risks"
ON "pgr_risks"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_pgr_actions" ON "pgr_actions";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_pgr_actions"
ON "pgr_actions"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_trainings" ON "trainings";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_trainings"
ON "trainings"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_settings" ON "settings";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_settings"
ON "settings"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
--> statement-breakpoint
DROP POLICY IF EXISTS "tenant_isolation_users" ON "users";
--> statement-breakpoint
CREATE POLICY "tenant_isolation_users"
ON "users"
FOR ALL
USING ("tenant_id" = public.current_tenant_id())
WITH CHECK ("tenant_id" = public.current_tenant_id());
