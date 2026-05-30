'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Admin client capable of bypassing RLS and Auth management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function addCompany(formData: FormData) {
  const name = formData.get('name') as string;
  const contact_person = formData.get('contact_person') as string;
  const contact_email = formData.get('contact_email') as string;
  const agreement_start_date = formData.get('agreement_start_date') as string;
  const agreement_end_date = formData.get('agreement_end_date') as string;
  const min_annual_jcoin_target = parseInt(formData.get('min_annual_jcoin_target') as string) || 0;

  if (!name || !contact_person || !contact_email) {
    throw new Error('Required fields missing');
  }

  // Ensure Service Role Key is available for Auth operations
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create company accounts. Please add it to .env.local');
  }

  // 1. Create User Auth Account
  const defaultPassword = 'CompanyPassword123!';
  const { error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: contact_email,
    password: defaultPassword,
    email_confirm: true,
  });

  if (authError && !authError.message.includes('already been registered')) {
    throw new Error(`Auth Error: ${authError.message}`);
  }

  // 2. Insert company
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({
      name,
      contact_person,
      contact_email,
      agreement_start_date: agreement_start_date || null,
      agreement_end_date: agreement_end_date || null,
      min_annual_jcoin_target
    })
    .select('id')
    .single();

  if (companyError) throw companyError;

  // 3. Insert draft MoU automatically
  const { error: mouError } = await supabase
    .from('mou_documents')
    .insert({
      company_id: company.id,
      status: 'draft',
      notes: 'Initial draft created during company registration'
    });

  if (mouError) throw mouError;

  revalidatePath('/admin/mou');
  revalidatePath('/admin/companies');
  revalidatePath('/admin');
  return { success: true };
}

export async function editCompany(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const contact_person = formData.get('contact_person') as string;
  const contact_email = formData.get('contact_email') as string;
  const agreement_start_date = formData.get('agreement_start_date') as string;
  const agreement_end_date = formData.get('agreement_end_date') as string;
  const min_annual_jcoin_target = parseInt(formData.get('min_annual_jcoin_target') as string) || 0;

  if (!name || !contact_person || !contact_email) {
    throw new Error('Required fields missing');
  }

  const { error } = await supabase
    .from('companies')
    .update({
      name,
      contact_person,
      contact_email,
      agreement_start_date: agreement_start_date || null,
      agreement_end_date: agreement_end_date || null,
      min_annual_jcoin_target
    })
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/admin/companies');
  revalidatePath('/admin/mou');
  return { success: true };
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);
    
  if (error) throw error;

  revalidatePath('/admin/companies');
  revalidatePath('/admin/mou');
  revalidatePath('/admin');
  return { success: true };
}

export async function addRule(formData: FormData) {
  const activity_name = formData.get('activity_name') as string;
  const points_awarded = parseInt(formData.get('points_awarded') as string) || 0;
  const annual_cap = formData.get('annual_cap') ? parseInt(formData.get('annual_cap') as string) : null;
  const validity_months = formData.get('validity_months') ? parseInt(formData.get('validity_months') as string) : null;

  if (!activity_name || points_awarded <= 0) {
    throw new Error('Valid Activity Name and Points Awarded are required');
  }

  const { error } = await supabase
    .from('jcoin_rules')
    .insert({
      activity_name,
      points_awarded,
      annual_cap,
      validity_months
    });

  if (error) throw error;

  revalidatePath('/admin/rules');
  return { success: true };
}
