-- J-Coins Management Platform - Supabase Schema

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables to allow rerunning the script cleanly
drop table if exists public.jcoin_ledger cascade;
drop table if exists public.jcoin_rules cascade;
drop table if exists public.mou_documents cascade;
drop table if exists public.user_profiles cascade;
drop table if exists public.companies cascade;

drop type if exists user_role cascade;
drop type if exists mou_status cascade;
drop type if exists ledger_status cascade;

-- 1. Companies Table
create table public.companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text not null,
  contact_email text not null,
  registered_address text,
  agreement_start_date date,
  agreement_end_date date,
  min_annual_jcoin_target integer default 0,
  office_space_allotted text,
  rental_details text,
  security_deposit numeric,
  special_commitments text,
  created_at timestamp with time zone default now()
);

-- 2. User Profiles Table (Extends Supabase Auth)
create type user_role as enum ('admin', 'company_rep');

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null default 'company_rep',
  company_id uuid references public.companies(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default now()
);

-- 3. MoU Documents Table
create type mou_status as enum ('draft', 'submitted', 'under_review', 'clarification_needed', 'approved', 'rejected');

create table public.mou_documents (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  status mou_status not null default 'draft',
  file_url text,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 4. J-Coin Rules Table
create table public.jcoin_rules (
  id uuid primary key default uuid_generate_v4(),
  activity_name text not null,
  category text,
  unit_of_measurement text,
  points_awarded numeric not null default 0,
  cap_rule text,
  annual_cap integer,
  validity_months integer default 12,
  is_eligible boolean default true,
  created_at timestamp with time zone default now()
);

-- 5. J-Coin Ledger Table
create type ledger_status as enum ('pending_approval', 'approved', 'rejected');

create table public.jcoin_ledger (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references public.companies(id) on delete cascade not null,
  date date not null default current_date,
  activity_id uuid references public.jcoin_rules(id) on delete set null,
  description text,
  coins_earned numeric default 0,
  coins_used numeric default 0,
  status ledger_status not null default 'pending_approval',
  supporting_document_url text,
  created_at timestamp with time zone default now()
);

-- Row Level Security (RLS) Setup (Basic Template)
alter table public.companies enable row level security;
alter table public.user_profiles enable row level security;
alter table public.mou_documents enable row level security;
alter table public.jcoin_rules enable row level security;
alter table public.jcoin_ledger enable row level security;

-- Admins can do anything
create policy "Admins have full access to companies" on public.companies for all using (
  exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins have full access to users" on public.user_profiles for all using (
  exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins have full access to MoUs" on public.mou_documents for all using (
  exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins have full access to rules" on public.jcoin_rules for all using (
  exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);

create policy "Admins have full access to ledger" on public.jcoin_ledger for all using (
  exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin')
);

-- Company Reps can read their own company
create policy "Company reps can read own company" on public.companies for select using (
  id = (select company_id from public.user_profiles where id = auth.uid())
);

-- Company Reps can read/write their own MoUs
create policy "Company reps can manage own MoUs" on public.mou_documents for all using (
  company_id = (select company_id from public.user_profiles where id = auth.uid())
);

-- Company Reps can read rules
create policy "Everyone can read rules" on public.jcoin_rules for select using (true);

-- Company Reps can read/write their own ledger entries (e.g. submit activities)
create policy "Company reps can manage own ledger entries" on public.jcoin_ledger for all using (
  company_id = (select company_id from public.user_profiles where id = auth.uid())
);
