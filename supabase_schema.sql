-- J-Coins Management Platform - Supabase Schema (Redesigned)
-- Strictly follows documentation: Objects.txt, J_coin_basic.txt

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to allow rerunning the script cleanly
drop table if exists public.contributions cascade;
drop table if exists public.activities cascade;
drop table if exists public.jcoin_ledger cascade;
drop table if exists public.jcoin_rules cascade;
drop table if exists public.mou_documents cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.companies cascade;

drop type if exists user_role cascade;
drop type if exists mou_status cascade;
drop type if exists ledger_status cascade;

-- ============================================
-- 1. Companies Table
-- Fields per documentation: Name, Term of contract, Room allocated,
-- Mode of joining, Area occupied, Starting date, Ending date
-- Target is computed at application layer:
--   offline → area_occupied / 5
--   online  → 100
-- ============================================
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text not null,
  contact_email text not null,
  term_of_contract integer not null default 1,
  agreement_start_date date not null,
  agreement_end_date date not null,
  room_allocated text,
  area_occupied numeric not null default 0,
  mode_of_joining text not null default 'offline'
    check (mode_of_joining in ('online', 'offline')),
  created_at timestamp with time zone default now()
);

-- ============================================
-- 2. Activities Table
-- Fields per documentation: Category, Title, Description, Unit, Rate
-- Categories: Academic, Non-Academic, Sponsorship
-- Cap is determined by category:
--   Academic    → no cap (100%)
--   Non-Academic → 50% of target
--   Sponsorship  → 10% of target
-- ============================================
create table public.activities (
  id uuid primary key default uuid_generate_v4(),
  serial_no integer,
  title text not null,
  description text,
  category text not null default 'Academic'
    check (category in ('Academic', 'Non-Academic', 'Sponsorship')),
  unit text not null,
  unit_label text,
  rate numeric not null default 0,
  is_system boolean default true,
  created_at timestamp with time zone default now()
);

-- ============================================
-- 3. Contributions Table (formerly "Earn object")
-- Fields per documentation: CompanyId, ActivityId, Amount, J_coins_earned, timestamp
-- term_year tracks which contract year (1-indexed) this contribution belongs to
-- Earnings reset every term year
-- ============================================
create table public.contributions (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  activity_id uuid references public.activities(id) on delete set null not null,
  amount numeric not null default 0,
  jcoins_earned numeric not null default 0,
  date date not null default current_date,
  notes text,
  term_year integer not null default 1,
  created_at timestamp with time zone default now()
);

-- ============================================
-- Row Level Security (RLS)
-- Using permissive dev policies since auth is handled via ADMIN_EMAILS in app code
-- ============================================
alter table public.companies enable row level security;
alter table public.activities enable row level security;
alter table public.contributions enable row level security;

-- Dev-mode open policies (will be tightened for production)
create policy "Allow all access to companies" on public.companies
  for all using (true) with check (true);

create policy "Allow all access to activities" on public.activities
  for all using (true) with check (true);

create policy "Allow all access to contributions" on public.contributions
  for all using (true) with check (true);
