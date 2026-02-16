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
  created_at timestamptz default now()
);

create table if not exists pgrs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete cascade,
  status text not null default 'draft',
  revision integer not null default 0,
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz,
  characterization text,
  responsibilities text,
  risk_criteria text,
  control_measures text,
  training_plan text,
  monitoring text,
  responsible_name text,
  responsible_registry text,
  progress integer default 0
);

create table if not exists pgr_risks (
  id uuid primary key default gen_random_uuid(),
  pgr_id uuid references pgrs(id) on delete cascade,
  sector text,
  role text,
  activity text,
  hazard text,
  risk text,
  risk_type text,
  probability integer,
  severity integer,
  risk_score integer,
  risk_level text,
  controls text,
  epi text,
  created_at timestamptz default now()
);

create table if not exists pgr_actions (
  id uuid primary key default gen_random_uuid(),
  pgr_id uuid references pgrs(id) on delete cascade,
  action text,
  owner text,
  due_date date,
  status text,
  created_at timestamptz default now()
);
