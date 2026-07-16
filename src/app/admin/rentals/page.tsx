import { supabase } from '@/lib/supabase';
import RentalSheet from '@/components/admin/RentalSheet';
import type { Company, RentalPayment, SecurityDeposit } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminRentals() {
  const [companiesResult, paymentsResult, depositsResult] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('rental_payments').select('*'),
    supabase.from('security_deposits').select('*'),
  ]);

  const companies = (companiesResult.data || []) as Company[];
  const payments = (paymentsResult.data || []) as RentalPayment[];
  const deposits = (depositsResult.data || []) as SecurityDeposit[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Rentals</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track monthly rent collection and security deposits across all companies
        </p>
      </div>

      <RentalSheet
        companies={companies}
        payments={payments}
        deposits={deposits}
      />
    </div>
  );
}
