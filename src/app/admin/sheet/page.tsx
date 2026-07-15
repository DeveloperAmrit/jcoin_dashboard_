import { supabase } from '@/lib/supabase';
import JCoinSheet from '@/components/admin/JCoinSheet';
import type { Company, Activity, Contribution } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminSheet() {
  // Fetch all data in parallel
  const [companiesResult, activitiesResult, contributionsResult] = await Promise.all([
    supabase.from('companies').select('*').order('name'),
    supabase.from('activities').select('*').order('category').order('serial_no'),
    supabase.from('contributions').select('*').order('date', { ascending: false }),
  ]);

  const companies = (companiesResult.data || []) as Company[];
  const activities = (activitiesResult.data || []) as Activity[];
  const contributions = (contributionsResult.data || []) as Contribution[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">J-Coin Sheet</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track J-Coin earnings across all companies and activities
        </p>
      </div>

      <JCoinSheet
        companies={companies}
        activities={activities}
        contributions={contributions}
      />
    </div>
  );
}
