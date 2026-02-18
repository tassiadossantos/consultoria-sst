create extension if not exists pgcrypto;

do $$
begin
  create type pgr_status as enum ('draft', 'active', 'expired', 'pending_review');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type training_status as enum ('agendado', 'realizado', 'vencendo', 'vencido');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type risk_type as enum ('fisico', 'quimico', 'biologico', 'ergonomico', 'acidente');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type action_status as enum ('PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type pgr_risk_level as enum ('Baixo', 'Médio', 'Alto');
exception
  when duplicate_object then null;
end $$;

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trade_name text,
  cnpj text unique,
  cnae text,
  address text,
  employees integer,
  risk_level integer,
  legal_responsible text,
  created_at timestamptz not null default now(),
  constraint companies_risk_level_chk check (risk_level is null or risk_level between 1 and 4),
  constraint companies_employees_chk check (employees is null or employees >= 0)
);

create table if not exists pgrs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  status pgr_status not null default 'draft',
  revision integer not null default 0,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  characterization text,
  responsibilities text,
  risk_criteria text,
  control_measures text,
  training_plan text,
  monitoring text,
  responsible_name text,
  responsible_registry text,
  progress integer not null default 0,
  constraint pgrs_revision_chk check (revision >= 0),
  constraint pgrs_progress_chk check (progress between 0 and 100)
);

create table if not exists pgr_risks (
  id uuid primary key default gen_random_uuid(),
  pgr_id uuid not null references pgrs(id) on delete cascade,
  sector text,
  role text,
  activity text,
  hazard text,
  risk text,
  risk_type risk_type,
  probability integer,
  severity integer,
  risk_score integer,
  risk_level pgr_risk_level,
  controls text,
  epi text,
  created_at timestamptz not null default now(),
  constraint pgr_risks_probability_chk check (probability is null or probability between 1 and 5),
  constraint pgr_risks_severity_chk check (severity is null or severity between 1 and 5),
  constraint pgr_risks_score_chk check (risk_score is null or risk_score between 1 and 25)
);

create table if not exists pgr_actions (
  id uuid primary key default gen_random_uuid(),
  pgr_id uuid not null references pgrs(id) on delete cascade,
  action text,
  owner text,
  due_date date,
  status action_status,
  created_at timestamptz not null default now()
);

create table if not exists trainings (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  title text not null,
  training_date date not null,
  instructor text,
  participants_label text,
  participants_count integer,
  status training_status not null default 'agendado',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  constraint trainings_participants_chk check (participants_count is null or participants_count >= 0)
);
