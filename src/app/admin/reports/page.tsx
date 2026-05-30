import { supabase } from '@/lib/supabase';
import ReportsChart from '@/components/admin/ReportsChart';

export const revalidate = 0;

export default async function AdminReports() {
  // Fetch all approved ledger entries
  const { data: ledgerEntries } = await supabase
    .from('jcoin_ledger')
    .select(`
      coins_earned,
      coins_used,
      companies ( name ),
      jcoin_rules ( activity_name )
    `)
    .eq('status', 'approved');

  const entries = ledgerEntries || [];

  // Aggregate Data: Total Metrics
  const totalEarned = entries.reduce((sum, e) => sum + (e.coins_earned || 0), 0);
  const totalUsed = entries.reduce((sum, e) => sum + (e.coins_used || 0), 0);

  // Aggregate Data: Top Companies
  const companyMap = new Map();
  entries.forEach((e) => {
    if (e.coins_earned > 0 && e.companies?.name) {
      const name = e.companies.name;
      companyMap.set(name, (companyMap.get(name) || 0) + e.coins_earned);
    }
  });

  const companyChartData = Array.from(companyMap.entries())
    .map(([name, totalEarned]) => ({ name, totalEarned }))
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 5); // Top 5

  // Aggregate Data: By Activity Rule
  const activityMap = new Map();
  entries.forEach((e) => {
    if (e.coins_earned > 0) {
      const name = e.jcoin_rules?.activity_name || 'Other / System';
      activityMap.set(name, (activityMap.get(name) || 0) + e.coins_earned);
    }
  });

  const activityChartData = Array.from(activityMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">System Reports</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          Download CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-md text-white">
          <p className="text-blue-100 font-medium mb-2">Total J-Coins Issued All-Time</p>
          <h3 className="text-4xl font-bold">{totalEarned.toLocaleString()}</h3>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-md text-white">
          <p className="text-emerald-100 font-medium mb-2">Total J-Coins Redeemed</p>
          <h3 className="text-4xl font-bold">{totalUsed.toLocaleString()}</h3>
        </div>
      </div>

      <ReportsChart 
        companyData={companyChartData} 
        activityData={activityChartData} 
      />
    </div>
  );
}
