-- ============================================================
-- Zellu - Migration 004: campaign_queue + anti-ban controls
-- ============================================================
-- Fila de envio de campanhas com controle de delay, variação
-- de mensagem e limite diário (anti-ban para disparos em massa).
-- ============================================================

-- ============================================================
-- 1. campaign_queue: fila de envios por contato
-- ============================================================
create table if not exists public.campaign_queue (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  phone text not null,
  message text not null,
  status text default 'pending' check (status in ('pending', 'sending', 'sent', 'failed')),
  scheduled_at timestamptz default now(),
  sent_at timestamptz,
  error_message text,
  created_at timestamptz default now()
);

create index if not exists idx_campaign_queue_status on public.campaign_queue(pharmacy_id, status, scheduled_at);
create index if not exists idx_campaign_queue_campaign on public.campaign_queue(campaign_id);

alter table public.campaign_queue enable row level security;

drop policy if exists "pharmacy isolation" on public.campaign_queue;
create policy "pharmacy isolation" on public.campaign_queue for all
  using (pharmacy_id = (select pharmacy_id from public.users where id = auth.uid()));

-- ============================================================
-- 2. campaigns: novos campos de configuração de velocidade
-- ============================================================
alter table public.campaigns
  add column if not exists speed_mode text default 'safe' check (speed_mode in ('safe', 'normal', 'fast')),
  add column if not exists vary_messages boolean default true,
  add column if not exists daily_limit_used integer default 0;

-- ============================================================
-- 3. daily_send_counts: contador diário por farmácia
-- ============================================================
create table if not exists public.daily_send_counts (
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  date date not null default current_date,
  count integer default 0,
  primary key (pharmacy_id, date)
);

alter table public.daily_send_counts enable row level security;

drop policy if exists "pharmacy isolation" on public.daily_send_counts;
create policy "pharmacy isolation" on public.daily_send_counts for all
  using (pharmacy_id = (select pharmacy_id from public.users where id = auth.uid()));

-- ============================================================
-- 4. RPCs para contadores atomicos (evita race conditions)
-- ============================================================
create or replace function public.increment_campaign_sent(p_campaign_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.campaigns
  set sent_count = coalesce(sent_count, 0) + 1,
      updated_at = now()
  where id = p_campaign_id;
$$;

create or replace function public.increment_campaign_failed(p_campaign_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.campaigns
  set failed_count = coalesce(failed_count, 0) + 1,
      updated_at = now()
  where id = p_campaign_id;
$$;

-- Marca uma campanha como completed quando todos os itens da fila forem processados
create or replace function public.finalize_campaign_if_done(p_campaign_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  pending_count int;
begin
  select count(*) into pending_count
  from public.campaign_queue
  where campaign_id = p_campaign_id and status in ('pending', 'sending');

  if pending_count = 0 then
    update public.campaigns
    set status = 'completed',
        completed_at = now(),
        updated_at = now()
    where id = p_campaign_id and status = 'running';
  end if;
end;
$$;
