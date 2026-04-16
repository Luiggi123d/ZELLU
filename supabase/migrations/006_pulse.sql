-- ============================================================
-- Zellu - Migration 006: Pulse — termômetro da farmácia
-- ============================================================
-- Linha do tempo de eventos, sentimento de conversas,
-- status de onboarding da farmácia.
-- ============================================================

-- ============================================================
-- 1. pharmacy_events: feed de eventos da farmácia
-- ============================================================
create table if not exists public.pharmacy_events (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  type text not null check (type in (
    'client_recovered', 'campaign_sent', 'new_contact',
    'client_lost_risk', 'complaint_detected', 'onboarding_complete'
  )),
  title text not null,
  description text,
  value_brl numeric default 0,
  contact_id uuid references public.contacts(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_pharmacy_events_pharmacy on public.pharmacy_events(pharmacy_id, created_at desc);

alter table public.pharmacy_events enable row level security;

drop policy if exists "pharmacy isolation" on public.pharmacy_events;
create policy "pharmacy isolation" on public.pharmacy_events for all
  using (pharmacy_id = (select pharmacy_id from public.users where id = auth.uid()));

-- ============================================================
-- 2. conversations: campos de sentimento e reclamação
-- ============================================================
alter table public.conversations
  add column if not exists sentiment text check (sentiment in ('positive', 'neutral', 'negative')) default 'neutral',
  add column if not exists has_complaint boolean default false,
  add column if not exists complaint_summary text,
  add column if not exists complaint_topics text[] default '{}',
  add column if not exists sentiment_analyzed_at timestamptz;

-- ============================================================
-- 3. pharmacies: status de onboarding
-- ============================================================
alter table public.pharmacies
  add column if not exists onboarding_status text default 'pending'
    check (onboarding_status in ('pending', 'processing', 'complete')),
  add column if not exists onboarding_started_at timestamptz,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists history_days_processed integer default 0;
