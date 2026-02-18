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

update companies
set risk_level = null
where risk_level is not null and risk_level not between 1 and 4;

update companies
set employees = null
where employees is not null and employees < 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'companies_risk_level_chk') then
    alter table companies
      add constraint companies_risk_level_chk check (risk_level is null or risk_level between 1 and 4);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'companies_employees_chk') then
    alter table companies
      add constraint companies_employees_chk check (employees is null or employees >= 0);
  end if;
end $$;

update pgrs
set status = 'draft'
where status is null or status not in ('draft', 'active', 'expired', 'pending_review');

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgrs' and column_name = 'status' and udt_name <> 'pgr_status'
  ) then
    alter table pgrs
      alter column status drop default;

    alter table pgrs
      alter column status type pgr_status
      using status::pgr_status;
  end if;
end $$;

alter table pgrs
  alter column status set default 'draft';

update pgrs
set revision = 0
where revision is null or revision < 0;

alter table pgrs
  alter column revision set default 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pgrs_revision_chk') then
    alter table pgrs
      add constraint pgrs_revision_chk check (revision >= 0);
  end if;
end $$;

update pgrs
set progress = 0
where progress is null or progress < 0 or progress > 100;

alter table pgrs
  alter column progress set default 0,
  alter column progress set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pgrs_progress_chk') then
    alter table pgrs
      add constraint pgrs_progress_chk check (progress between 0 and 100);
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pgrs where company_id is null) then
    alter table pgrs alter column company_id set not null;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgr_risks' and column_name = 'risk_type' and udt_name <> 'risk_type'
  ) then
    update pgr_risks
    set risk_type = case
      when risk_type is null then null
      when lower(risk_type::text) in ('fisico', 'físico') then 'fisico'
      when lower(risk_type::text) in ('quimico', 'químico') then 'quimico'
      when lower(risk_type::text) in ('biologico', 'biológico') then 'biologico'
      when lower(risk_type::text) = 'ergonomico' then 'ergonomico'
      when lower(risk_type::text) = 'acidente' then 'acidente'
      else null
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgr_risks' and column_name = 'risk_type' and udt_name <> 'risk_type'
  ) then
    alter table pgr_risks
      alter column risk_type type risk_type
      using risk_type::risk_type;
  end if;
end $$;

update pgr_risks
set probability = null
where probability is not null and (probability < 1 or probability > 5);

update pgr_risks
set severity = null
where severity is not null and (severity < 1 or severity > 5);

update pgr_risks
set risk_score = null
where risk_score is not null and (risk_score < 1 or risk_score > 25);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgr_risks' and column_name = 'risk_level' and udt_name <> 'pgr_risk_level'
  ) then
    update pgr_risks
    set risk_level = case
      when risk_level is null then null
      when lower(risk_level::text) = 'baixo' then 'Baixo'
      when lower(risk_level::text) in ('medio', 'médio') then 'Médio'
      when lower(risk_level::text) = 'alto' then 'Alto'
      else null
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgr_risks' and column_name = 'risk_level' and udt_name <> 'pgr_risk_level'
  ) then
    alter table pgr_risks
      alter column risk_level type pgr_risk_level
      using risk_level::pgr_risk_level;
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'pgr_risks_probability_chk') then
    alter table pgr_risks
      add constraint pgr_risks_probability_chk check (probability is null or probability between 1 and 5);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pgr_risks_severity_chk') then
    alter table pgr_risks
      add constraint pgr_risks_severity_chk check (severity is null or severity between 1 and 5);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'pgr_risks_score_chk') then
    alter table pgr_risks
      add constraint pgr_risks_score_chk check (risk_score is null or risk_score between 1 and 25);
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgr_actions' and column_name = 'status' and udt_name <> 'action_status'
  ) then
    update pgr_actions
    set status = case
      when status is null then null
      when upper(status::text) = 'PENDENTE' then 'PENDENTE'
      when upper(status::text) in ('EM_ANDAMENTO', 'EM ANDAMENTO') then 'EM_ANDAMENTO'
      when upper(status::text) in ('CONCLUIDO', 'CONCLUÍDO') then 'CONCLUIDO'
      when upper(status::text) = 'CANCELADO' then 'CANCELADO'
      else null
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'pgr_actions' and column_name = 'status' and udt_name <> 'action_status'
  ) then
    alter table pgr_actions
      alter column status type action_status
      using status::action_status;
  end if;
end $$;

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
  updated_at timestamptz
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'trainings' and column_name = 'status' and udt_name <> 'training_status'
  ) then
    update trainings
    set status = case
      when status is null then 'agendado'
      when lower(status::text) in ('agendado', 'realizado', 'vencendo', 'vencido') then lower(status::text)
      else 'agendado'
    end;
  end if;
end $$;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_name = 'trainings' and column_name = 'status' and udt_name <> 'training_status'
  ) then
    alter table trainings
      alter column status drop default;

    alter table trainings
      alter column status type training_status
      using status::training_status;
  end if;
end $$;

alter table trainings
  alter column status set default 'agendado';

update trainings
set participants_count = null
where participants_count is not null and participants_count < 0;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'trainings_participants_chk') then
    alter table trainings
      add constraint trainings_participants_chk check (participants_count is null or participants_count >= 0);
  end if;
end $$;