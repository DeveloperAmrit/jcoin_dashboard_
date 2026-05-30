-- Fix infinite recursion in user_profiles policy
drop policy if exists "Admins have full access to users" on public.user_profiles;

-- Create a secure function to check admin status without triggering infinite recursion
create or replace function public.is_admin() returns boolean as $$
  select exists(select 1 from public.user_profiles where id = auth.uid() and role = 'admin');
$$ language sql security definer;

create policy "Admins have full access to users" on public.user_profiles for all using (
  public.is_admin()
);

-- IMPORTANT: Because authentication is not fully implemented yet in the Next.js app, 
-- all form submissions from the dashboard are considered "anonymous" by Supabase.
-- The default policies block anonymous inserts. 
-- Run the following to allow development access until authentication is set up:
create policy "Dev allow all companies" on public.companies for all using (true) with check (true);
create policy "Dev allow all mous" on public.mou_documents for all using (true) with check (true);
create policy "Dev allow all rules" on public.jcoin_rules for all using (true) with check (true);
create policy "Dev allow all ledger" on public.jcoin_ledger for all using (true) with check (true);
