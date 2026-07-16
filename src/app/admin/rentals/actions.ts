'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import type { RentalPaymentStatus } from '@/lib/types';

// ============================================
// Security Deposit Actions
// ============================================

export async function upsertSecurityDeposit(formData: FormData) {
  const company_id = formData.get('company_id') as string;
  const amount_paid = parseFloat(formData.get('amount_paid') as string) || 0;
  const total_due = parseFloat(formData.get('total_due') as string) || 0;
  const paid_at = (formData.get('paid_at') as string) || null;
  const is_refundable = formData.get('is_refundable') === 'true';
  const notes = (formData.get('notes') as string) || null;

  if (!company_id) throw new Error('Company ID required');

  // Check if record already exists
  const { data: existing } = await supabase
    .from('security_deposits')
    .select('id')
    .eq('company_id', company_id)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('security_deposits')
      .update({ amount_paid, total_due, paid_at, is_refundable, notes })
      .eq('company_id', company_id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('security_deposits')
      .insert({ company_id, amount_paid, total_due, paid_at, is_refundable, notes });
    if (error) throw error;
  }

  revalidatePath('/admin/rentals');
  return { success: true };
}

// ============================================
// Rental Payment Actions
// ============================================

export async function upsertRentalPayment(data: {
  company_id: string;
  year: number;
  month: number;
  amount_paid: number;
  total_due: number;
  status: RentalPaymentStatus;
  notes?: string | null;
}) {
  const { company_id, year, month, amount_paid, total_due, status, notes = null } = data;

  // Check if record already exists for this company/year/month
  const { data: existing } = await supabase
    .from('rental_payments')
    .select('id')
    .eq('company_id', company_id)
    .eq('year', year)
    .eq('month', month)
    .single();

  if (existing) {
    const { error } = await supabase
      .from('rental_payments')
      .update({ amount_paid, total_due, status, notes })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('rental_payments')
      .insert({ company_id, year, month, amount_paid, total_due, status, notes });
    if (error) throw error;
  }

  revalidatePath('/admin/rentals');
  return { success: true };
}

export async function deleteRentalPayment(company_id: string, year: number, month: number) {
  const { error } = await supabase
    .from('rental_payments')
    .delete()
    .eq('company_id', company_id)
    .eq('year', year)
    .eq('month', month);
  if (error) throw error;
  revalidatePath('/admin/rentals');
  return { success: true };
}
