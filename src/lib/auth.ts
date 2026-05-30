import { createClient } from '@/utils/supabase/server';

const ADMIN_EMAILS = [
  'b24cm1008@iitj.ac.in',
  'amanager@techpark.iitj.ac.in',
  'ceo@techpark.iitj.ac.in',
  'manager@techpark.iitj.ac.in'
].map(e => e.toLowerCase());

export type UserRole = 'admin' | 'company' | 'none';

export async function getUserRoleAndData(): Promise<{ role: UserRole, email: string | null, companyId: string | null }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return { role: 'none', email: null, companyId: null };
  }

  const email = user.email.toLowerCase();

  // Check if Admin
  if (ADMIN_EMAILS.includes(email)) {
    return { role: 'admin', email, companyId: null };
  }

  // Check if Company
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .ilike('contact_email', email)
    .single();

  if (company) {
    return { role: 'company', email, companyId: company.id };
  }

  return { role: 'none', email, companyId: null };
}
