-- ============================================================
-- Zellu - Migration 002: whatsapp_instances for Evolution API
-- ============================================================
-- Reshapes the whatsapp_instances table (originally designed for Z-API)
-- to work with Evolution API: one instance per pharmacy, addressed by
-- instance_name = 'zellu-{pharmacy_id}'.
-- ============================================================

-- Drop legacy Z-API columns if they exist
alter table public.whatsapp_instances
  drop column if exists instance_id,
  drop column if exists instance_token,
  drop column if exists qr_code;

-- Add Evolution API columns
alter table public.whatsapp_instances
  add column if not exists instance_name text,
  add column if not exists connected_at timestamptz;

-- Drop legacy status check constraint (name pattern differs across Postgres versions)
do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.whatsapp_instances'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%status%'
  loop
    execute format('alter table public.whatsapp_instances drop constraint %I', c.conname);
  end loop;
end$$;

-- Make instance_name NOT NULL (backfill with a placeholder if there are old rows)
update public.whatsapp_instances
  set instance_name = coalesce(instance_name, 'zellu-' || pharmacy_id::text)
  where instance_name is null;
alter table public.whatsapp_instances alter column instance_name set not null;

-- One instance per pharmacy (so we can upsert on pharmacy_id)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.whatsapp_instances'::regclass
      and conname = 'whatsapp_instances_pharmacy_unique'
  ) then
    alter table public.whatsapp_instances
      add constraint whatsapp_instances_pharmacy_unique unique (pharmacy_id);
  end if;
end$$;

-- Unique instance_name for lookups
create unique index if not exists idx_whatsapp_instances_instance_name
  on public.whatsapp_instances (instance_name);

-- Ensure RLS is enabled (idempotent)
alter table public.whatsapp_instances enable row level security;

-- Recreate policy (drop old name from migration 001 if present, create the new one)
drop policy if exists "Tenant isolation" on public.whatsapp_instances;
drop policy if exists "pharmacy_own_instance" on public.whatsapp_instances;
create policy "pharmacy_own_instance" on public.whatsapp_instances
  for all using (pharmacy_id = public.get_my_pharmacy_id());
