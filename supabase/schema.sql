-- ============================================================
-- BATEO — Supabase şeması (v2.0-b)
-- Supabase panelinde: SQL Editor → New query → bu içeriği yapıştır → RUN
-- ============================================================

-- Tek "records" tablosu: tüm varlıkları (not, görev, ders ...) tutar.
create table if not exists public.records (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  table_name text        not null,
  doc_id     text        not null,
  data       jsonb,
  updated_at bigint      not null,
  deleted    boolean     not null default false,
  primary key (user_id, table_name, doc_id)
);

-- Çekme (pull) için hız indeksi
create index if not exists records_user_updated_idx
  on public.records (user_id, updated_at);

-- ------------------------------------------------------------
-- Satır Düzeyi Güvenlik (RLS): herkes sadece kendi verisini görür
-- ------------------------------------------------------------
alter table public.records enable row level security;

drop policy if exists "records_select_own" on public.records;
create policy "records_select_own" on public.records
  for select using (auth.uid() = user_id);

drop policy if exists "records_insert_own" on public.records;
create policy "records_insert_own" on public.records
  for insert with check (auth.uid() = user_id);

drop policy if exists "records_update_own" on public.records;
create policy "records_update_own" on public.records
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "records_delete_own" on public.records;
create policy "records_delete_own" on public.records
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- Toplu gönderim (push): çakışmada son yazan kazanır
-- updated_at daha yeni değilse mevcut kaydın üzerine yazmaz.
-- ------------------------------------------------------------
create or replace function public.push_records(p_records jsonb)
returns void
language plpgsql
as $$
declare
  r jsonb;
begin
  for r in select * from jsonb_array_elements(p_records) loop
    insert into public.records (user_id, table_name, doc_id, data, updated_at, deleted)
    values (
      auth.uid(),
      r->>'table_name',
      r->>'doc_id',
      r->'data',
      (r->>'updated_at')::bigint,
      (r->>'deleted')::boolean
    )
    on conflict (user_id, table_name, doc_id)
    do update set
      data = excluded.data,
      updated_at = excluded.updated_at,
      deleted = excluded.deleted
    where excluded.updated_at >= public.records.updated_at;
  end loop;
end;
$$;

-- ------------------------------------------------------------
-- (İsteğe bağlı) Gerçek zamanlı senkron için tabloyu yayına ekle
-- Zaten ekliyse hata vermez (idempotent)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'records'
  ) then
    alter publication supabase_realtime add table public.records;
  end if;
end $$;

