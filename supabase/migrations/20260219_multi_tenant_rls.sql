create or replace function public.current_tenant_id()
returns varchar
language sql
stable
as $$
  select coalesce(
    nullif((nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'tenant_id'), ''),
    nullif(current_setting('app.current_tenant_id', true), '')
  )::varchar;
$$;

alter table if exists companies enable row level security;
alter table if exists pgrs enable row level security;
alter table if exists pgr_risks enable row level security;
alter table if exists pgr_actions enable row level security;
alter table if exists trainings enable row level security;
alter table if exists settings enable row level security;
alter table if exists users enable row level security;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'companies') then
    drop policy if exists tenant_isolation_companies on companies;
    create policy tenant_isolation_companies
      on companies
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'pgrs') then
    drop policy if exists tenant_isolation_pgrs on pgrs;
    create policy tenant_isolation_pgrs
      on pgrs
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'pgr_risks') then
    drop policy if exists tenant_isolation_pgr_risks on pgr_risks;
    create policy tenant_isolation_pgr_risks
      on pgr_risks
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'pgr_actions') then
    drop policy if exists tenant_isolation_pgr_actions on pgr_actions;
    create policy tenant_isolation_pgr_actions
      on pgr_actions
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'trainings') then
    drop policy if exists tenant_isolation_trainings on trainings;
    create policy tenant_isolation_trainings
      on trainings
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'settings') then
    drop policy if exists tenant_isolation_settings on settings;
    create policy tenant_isolation_settings
      on settings
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;

do $$
begin
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
    drop policy if exists tenant_isolation_users on users;
    create policy tenant_isolation_users
      on users
      for all
      using (tenant_id = public.current_tenant_id())
      with check (tenant_id = public.current_tenant_id());
  end if;
end $$;
