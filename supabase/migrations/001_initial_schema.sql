-- ============================================================
-- Zellu CRM - Initial Schema
-- Multi-tenant with Row Level Security
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PHARMACIES (tenants)
-- ============================================================
create table pharmacies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  cnpj text unique not null,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip_code text,
  logo_url text,
  owner_id uuid not null,
  stripe_customer_id text,
  subscription_status text default 'trial' check (subscription_status in ('trial', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz default (now() + interval '14 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. USERS (pharmacy staff)
-- ============================================================
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null default 'staff' check (role in ('owner', 'admin', 'staff')),
  avatar_url text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 3. WHATSAPP INSTANCES (Z-API connections)
-- ============================================================
create table whatsapp_instances (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  instance_id text not null,
  instance_token text not null,
  phone_number text,
  status text default 'disconnected' check (status in ('connected', 'disconnected', 'connecting')),
  qr_code text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 4. CONTACTS (pharmacy customers)
-- ============================================================
create table contacts (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  phone text not null,
  name text,
  email text,
  cpf text,
  birth_date date,
  notes text,
  tags text[] default '{}',
  last_purchase_at timestamptz,
  total_purchases integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(pharmacy_id, phone)
);

-- ============================================================
-- 5. CONVERSATIONS
-- ============================================================
create table conversations (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  whatsapp_instance_id uuid references whatsapp_instances(id),
  status text default 'open' check (status in ('open', 'closed', 'pending')),
  assigned_to uuid references users(id),
  last_message_at timestamptz,
  unread_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 6. MESSAGES
-- ============================================================
create table messages (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  contact_id uuid not null references contacts(id),
  direction text not null check (direction in ('inbound', 'outbound')),
  content text,
  media_url text,
  media_type text,
  status text default 'pending' check (status in ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_by uuid references users(id),
  external_id text,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. CAMPAIGNS
-- ============================================================
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  pharmacy_id uuid not null references pharmacies(id) on delete cascade,
  name text not null,
  message_template text not null,
  target_tags text[] default '{}',
  status text default 'draft' check (status in ('draft', 'scheduled', 'running', 'completed', 'canceled')),
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  total_recipients integer default 0,
  sent_count integer default 0,
  delivered_count integer default 0,
  read_count integer default 0,
  failed_count integer default 0,
  created_by uuid references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_users_pharmacy on users(pharmacy_id);
create index idx_contacts_pharmacy on contacts(pharmacy_id);
create index idx_contacts_phone on contacts(pharmacy_id, phone);
create index idx_conversations_pharmacy on conversations(pharmacy_id);
create index idx_conversations_contact on conversations(contact_id);
create index idx_messages_conversation on messages(conversation_id);
create index idx_messages_pharmacy on messages(pharmacy_id);
create index idx_campaigns_pharmacy on campaigns(pharmacy_id);
create index idx_whatsapp_instances_pharmacy on whatsapp_instances(pharmacy_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_pharmacies_updated_at before update on pharmacies for each row execute function update_updated_at();
create trigger trg_users_updated_at before update on users for each row execute function update_updated_at();
create trigger trg_contacts_updated_at before update on contacts for each row execute function update_updated_at();
create trigger trg_conversations_updated_at before update on conversations for each row execute function update_updated_at();
create trigger trg_campaigns_updated_at before update on campaigns for each row execute function update_updated_at();
create trigger trg_whatsapp_instances_updated_at before update on whatsapp_instances for each row execute function update_updated_at();

-- ============================================================
-- HELPER FUNCTION (in public schema)
-- ============================================================
create or replace function public.get_my_pharmacy_id()
returns uuid as $$
  select pharmacy_id from public.users where id = auth.uid()
$$ language sql security definer stable;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
alter table pharmacies enable row level security;
alter table users enable row level security;
alter table whatsapp_instances enable row level security;
alter table contacts enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table campaigns enable row level security;

-- PHARMACIES: users can only see their own pharmacy
create policy "Users can view own pharmacy"
  on pharmacies for select
  using (id = public.get_my_pharmacy_id());

create policy "Owners can update own pharmacy"
  on pharmacies for update
  using (id = public.get_my_pharmacy_id());

-- USERS: can see colleagues in same pharmacy
create policy "Users can view pharmacy members"
  on users for select
  using (pharmacy_id = public.get_my_pharmacy_id());

create policy "Users can update own profile"
  on users for update
  using (id = auth.uid());

-- WHATSAPP INSTANCES: tenant-isolated
create policy "Tenant isolation"
  on whatsapp_instances for all
  using (pharmacy_id = public.get_my_pharmacy_id());

-- CONTACTS: tenant-isolated
create policy "Tenant isolation"
  on contacts for all
  using (pharmacy_id = public.get_my_pharmacy_id());

-- CONVERSATIONS: tenant-isolated
create policy "Tenant isolation"
  on conversations for all
  using (pharmacy_id = public.get_my_pharmacy_id());

-- MESSAGES: tenant-isolated
create policy "Tenant isolation"
  on messages for all
  using (pharmacy_id = public.get_my_pharmacy_id());

-- CAMPAIGNS: tenant-isolated
create policy "Tenant isolation"
  on campaigns for all
  using (pharmacy_id = public.get_my_pharmacy_id());
