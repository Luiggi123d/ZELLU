-- ============================================================
-- Zellu - Migration 003: enable Supabase Realtime for CRM tables
-- ============================================================
-- The frontend subscribes to `conversations` and `messages` so
-- that incoming WhatsApp messages appear live without an F5.
-- For subscriptions to work, the tables must be part of the
-- `supabase_realtime` publication.
-- ============================================================

do $$
begin
  -- conversations
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'conversations'
  ) then
    execute 'alter publication supabase_realtime add table public.conversations';
  end if;

  -- messages
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;

  -- contacts (dashboard/contacts/radar pages read from this)
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'contacts'
  ) then
    execute 'alter publication supabase_realtime add table public.contacts';
  end if;
end$$;

-- Ensure full row payloads on UPDATE so the frontend receives
-- the complete new row (not just the primary key).
alter table public.conversations replica identity full;
alter table public.messages replica identity full;
alter table public.contacts replica identity full;
