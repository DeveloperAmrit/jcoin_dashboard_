'use server';

import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// Admin client capable of bypassing RLS and Auth management
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ============================================
// Company Actions
// ============================================

export async function addCompany(formData: FormData) {
  const name = formData.get('name') as string;
  const contact_person = formData.get('contact_person') as string;
  const contact_email = formData.get('contact_email') as string;
  const category = (formData.get('category') as string) || 'S1';
  const associated_professors_raw = (formData.get('associated_professors') as string) || '';
  const associated_professors = associated_professors_raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const term_of_contract = parseInt(formData.get('term_of_contract') as string) || 1;
  const agreement_start_date = formData.get('agreement_start_date') as string;
  const room_allocated = (formData.get('room_allocated') as string) || null;
  const area_occupied = parseFloat(formData.get('area_occupied') as string) || 0;
  const mode_of_joining = (formData.get('mode_of_joining') as string) || 'offline';

  if (!name || !contact_person || !contact_email || !agreement_start_date) {
    throw new Error('Required fields missing');
  }

  // Auto-compute end date from start + term
  const startDate = new Date(agreement_start_date);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + term_of_contract);
  const agreement_end_date = endDate.toISOString().split('T')[0];

  // Create Auth account if service role key is available
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const defaultPassword = 'CompanyPassword123!';
    const { error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: contact_email,
      password: defaultPassword,
      email_confirm: true,
    });

    if (authError && !authError.message.includes('already been registered')) {
      throw new Error(`Auth Error: ${authError.message}`);
    }
  }

  const { error: companyError } = await supabase
    .from('companies')
    .insert({
      name,
      contact_person,
      contact_email,
      category,
      associated_professors,
      term_of_contract,
      agreement_start_date,
      agreement_end_date,
      room_allocated,
      area_occupied,
      mode_of_joining,
    });

  if (companyError) throw companyError;

  revalidatePath('/admin/companies');
  revalidatePath('/admin/sheet');
  revalidatePath('/admin');
  return { success: true };
}

export async function editCompany(id: string, formData: FormData) {
  const name = formData.get('name') as string;
  const contact_person = formData.get('contact_person') as string;
  const contact_email = formData.get('contact_email') as string;
  const category = (formData.get('category') as string) || 'S1';
  const associated_professors_raw = (formData.get('associated_professors') as string) || '';
  const associated_professors = associated_professors_raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const term_of_contract = parseInt(formData.get('term_of_contract') as string) || 1;
  const agreement_start_date = formData.get('agreement_start_date') as string;
  const room_allocated = (formData.get('room_allocated') as string) || null;
  const area_occupied = parseFloat(formData.get('area_occupied') as string) || 0;
  const mode_of_joining = (formData.get('mode_of_joining') as string) || 'offline';

  if (!name || !contact_person || !contact_email || !agreement_start_date) {
    throw new Error('Required fields missing');
  }

  // Auto-compute end date
  const startDate = new Date(agreement_start_date);
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + term_of_contract);
  const agreement_end_date = endDate.toISOString().split('T')[0];

  const { error } = await supabase
    .from('companies')
    .update({
      name,
      contact_person,
      contact_email,
      category,
      associated_professors,
      term_of_contract,
      agreement_start_date,
      agreement_end_date,
      room_allocated,
      area_occupied,
      mode_of_joining,
    })
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/admin/companies');
  revalidatePath('/admin/sheet');
  revalidatePath('/admin');
  return { success: true };
}

export async function deleteCompany(id: string) {
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/admin/companies');
  revalidatePath('/admin/sheet');
  revalidatePath('/admin');
  return { success: true };
}

// ============================================
// Activity Actions
// ============================================

export async function addActivity(formData: FormData) {
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || null;
  const category = formData.get('category') as string;
  const unit = formData.get('unit') as string;
  const unit_label = (formData.get('unit_label') as string) || null;
  const rate = parseFloat(formData.get('rate') as string) || 0;

  if (!title || !category || !unit || rate <= 0) {
    throw new Error('Title, category, unit, and a positive rate are required');
  }

  const { error } = await supabase
    .from('activities')
    .insert({
      title,
      description,
      category,
      unit,
      unit_label,
      rate,
      is_system: false,
    });

  if (error) throw error;

  revalidatePath('/admin/activities');
  revalidatePath('/admin/sheet');
  return { success: true };
}

export async function deleteActivity(id: string) {
  // Only allow deleting custom (non-system) activities
  const { data: activity } = await supabase
    .from('activities')
    .select('is_system')
    .eq('id', id)
    .single();

  if (activity?.is_system) {
    throw new Error('Cannot delete system activities');
  }

  const { error } = await supabase
    .from('activities')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/admin/activities');
  revalidatePath('/admin/sheet');
  return { success: true };
}

// ============================================
// Contribution Actions
// ============================================

export async function addContribution(formData: FormData) {
  const company_id = formData.get('company_id') as string;
  const activity_id = formData.get('activity_id') as string;
  const amount = parseFloat(formData.get('amount') as string) || 0;
  const date = formData.get('date') as string;
  const notes = (formData.get('notes') as string) || null;
  const term_year = parseInt(formData.get('term_year') as string) || 1;

  if (!company_id || !activity_id || amount <= 0 || !date) {
    throw new Error('Company, activity, a positive amount, and date are required');
  }

  // Fetch the activity to compute jcoins_earned
  const { data: activity, error: activityError } = await supabase
    .from('activities')
    .select('rate')
    .eq('id', activity_id)
    .single();

  if (activityError || !activity) {
    throw new Error('Activity not found');
  }

  const jcoins_earned = amount * activity.rate;

  const { error } = await supabase
    .from('contributions')
    .insert({
      company_id,
      activity_id,
      amount,
      jcoins_earned,
      date,
      notes,
      term_year,
    });

  if (error) throw error;

  revalidatePath('/admin/sheet');
  revalidatePath('/admin');
  revalidatePath('/admin/reports');
  return { success: true, jcoins_earned };
}

export async function deleteContribution(id: string) {
  const { error } = await supabase
    .from('contributions')
    .delete()
    .eq('id', id);

  if (error) throw error;

  revalidatePath('/admin/sheet');
  revalidatePath('/admin');
  revalidatePath('/admin/reports');
  return { success: true };
}
