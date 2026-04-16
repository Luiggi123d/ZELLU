-- Campos de IA nos contatos (enriquecimento via conversas)
alter table contacts
  add column if not exists ai_summary text,
  add column if not exists ai_interests text[] default '{}',
  add column if not exists ai_last_purchase_product text,
  add column if not exists ai_behavior text default 'unknown'
    check (ai_behavior in ('buyer', 'browser', 'support', 'inactive', 'unknown')),
  add column if not exists ai_enriched_at timestamptz,
  add column if not exists total_spent numeric default 0,
  add column if not exists avg_ticket numeric default 0;
