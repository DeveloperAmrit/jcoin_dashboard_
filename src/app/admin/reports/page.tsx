import { supabase } from '@/lib/supabase';
import ReportsChart from '@/components/admin/ReportsChart';
import type { Contribution, Activity } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ContributionWithJoins {
  jcoins_earned: number;
  companies: { name: string } | null;
  activities: { title: string; category: string } | null;
}

export default async function AdminReports() {
  // Fetch contributions with joins
  const { data: contributionEntries } = await supabase
    .from('contributions')
    .select(`
      jcoins_earned,
      companies ( name ),
      activities ( title, category )
    `);

  const entries = (contributionEntries || []) as unknown as ContributionWithJoins[];

  // Total metrics
  const totalEarned = entries.reduce((sum, e) => sum + (e.jcoins_earned || 0), 0);

  // Top companies
  const companyMap = new Map<string, number>();
  entries.forEach((e) => {
    if (e.jcoins_earned > 0 && e.companies?.name) {
      const name = e.companies.name;
      companyMap.set(name, (companyMap.get(name) || 0) + e.jcoins_earned);
    }
  });

  const companyChartData = Array.from(companyMap.entries())
    .map(([name, totalEarned]) => ({ name, totalEarned }))
    .sort((a, b) => b.totalEarned - a.totalEarned)
    .slice(0, 5);

  // By activity
  const activityMap = new Map<string, number>();
  entries.forEach((e) => {
    if (e.jcoins_earned > 0) {
      const name = e.activities?.title || 'Other';
      activityMap.set(name, (activityMap.get(name) || 0) + e.jcoins_earned);
    }
  });

  const activityChartData = Array.from(activityMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // By category
  const categoryMap = new Map<string, number>();
  entries.forEach((e) => {
    if (e.jcoins_earned > 0) {
      const category = e.activities?.category || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + e.jcoins_earned);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">System Reports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-6 rounded-2xl shadow-md text-white">
          <p className="text-blue-100 font-medium mb-2">Total J-Coins Earned</p>
          <h3 className="text-4xl font-bold">{totalEarned.toLocaleString()}</h3>
        </div>
        {['Academic', 'Non-Academic', 'Sponsorship'].map((cat) => {
          const val = categoryMap.get(cat) || 0;
          const colors: Record<string, string> = {
            Academic: 'from-blue-400 to-blue-600',
            'Non-Academic': 'from-emerald-400 to-emerald-600',
            Sponsorship: 'from-amber-400 to-amber-600',
          };
          return (
            <div key={cat} className={`bg-gradient-to-br ${colors[cat]} p-6 rounded-2xl shadow-md text-white`}>
              <p className="text-white/80 font-medium mb-2">{cat}</p>
              <h3 className="text-3xl font-bold">{val.toLocaleString()} JC</h3>
            </div>
          );
        })}
      </div>

      <ReportsChart
        companyData={companyChartData}
        activityData={activityChartData}
      />
    </div>
  );
}
