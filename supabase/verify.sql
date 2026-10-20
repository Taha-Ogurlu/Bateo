-- ============================================================
-- BATEO — Supabase kurulum doğrulaması (SALT OKUNUR)
-- SQL Editor'de çalıştır → her satır "beklenen" değeri göstermeli
-- ============================================================

select '1. records tablosu'            as kontrol, count(*)::text as sonuc, '1' as beklenen
  from information_schema.tables
 where table_schema = 'public' and table_name = 'records'
union all
select '2. RLS politikaları',          count(*)::text, '4'
  from pg_policies
 where schemaname = 'public' and tablename = 'records'
union all
select '3. RLS aktif',                 (case when relrowsecurity then '1' else '0' end), '1'
  from pg_class
 where relname = 'records'
union all
select '4. push_records fonksiyonu',   count(*)::text, '1'
  from pg_proc
 where proname = 'push_records'
union all
select '5. realtime yayını',           count(*)::text, '1'
  from pg_publication_tables
 where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'records'
union all
select '6. records satır sayım',       count(*)::text, '-'
  from public.records;
