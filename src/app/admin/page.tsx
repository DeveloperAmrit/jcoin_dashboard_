import { supabase } from '@/lib/supabase';
import { computeTarget, getCurrentTermYear, filterContributionsByTermYear, computeCategoryEarnings, getCurrentFinancialYear } from '@/lib/jcoin-utils';
import type { Company, Activity, Contribution, ContributionWithCompanyAndActivity } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Fetch all data
  const [companiesResult, activitiesResult, contributionsResult, recentResult] = await Promise.all([
    supabase.from('companies').select('*'),
    supabase.from('activities').select('*'),
    supabase.from('contributions').select('*'),
    supabase.from('contributions')
      .select(`
        id,
        date,
        notes,
        jcoins_earned,
        created_at,
        companies ( name ),
        activities ( title, category )
      `)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const companies = (companiesResult.data || []) as Company[];
  const activities = (activitiesResult.data || []) as Activity[];
  const contributions = (contributionsResult.data || []) as Contribution[];
  const recentActivity = (recentResult.data || []) as unknown as ContributionWithCompanyAndActivity[];

  // KPI: Total companies
  const totalCompanies = companies.length;

  // KPI: Total J-Coins earned (all companies, current term year)
  let totalEarnedCurrentTerm = 0;
  let companiesBelowTarget = 0;

  for (const company of companies) {
    const target = computeTarget(company);
    const termYear = getCurrentTermYear(company);
    const compContribs = contributions.filter((c) => c.company_id === company.id);
    const termContribs = filterContributionsByTermYear(compContribs, termYear);
    const earnings = computeCategoryEarnings(termContribs, activities);
    totalEarnedCurrentTerm += earnings.total;
    if (earnings.total < target) {
      companiesBelowTarget++;
    }
  }

  // KPI: Total activities
  const totalActivities = activities.length;

  const fy = getCurrentFinancialYear();

  const kpis = [
    { label: 'Total Companies', value: totalCompanies.toString(), trend: 'Registered on platform' },
    { label: 'J-Coins Earned (Current Term)', value: totalEarnedCurrentTerm.toLocaleString(), trend: `FY ${fy.label}` },
    { label: 'Below Target', value: companiesBelowTarget.toString(), trend: companiesBelowTarget > 0 ? 'Requires attention' : 'All on track' },
    { label: 'Activities Available', value: totalActivities.toString(), trend: 'Across all categories' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-slate-800">{kpi.value}</h3>
            </div>
            <p className={`text-xs font-medium mt-4 ${kpi.trend.includes('attention') ? 'text-amber-500' : 'text-emerald-500'}`}>
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Contributions</h2>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.map((entry) => (
              <div key={entry.id} className="flex gap-4 items-start border-b border-slate-50 pb-4 last:border-0">
                <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                  entry.activities?.category === 'Academic'
                    ? 'bg-blue-500'
                    : entry.activities?.category === 'Non-Academic'
                      ? 'bg-emerald-500'
                      : 'bg-amber-500'
                }`}></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">
                    {entry.companies?.name || 'A company'} — {entry.activities?.title || entry.notes || 'Contribution'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(entry.created_at).toLocaleDateString()} · +{entry.jcoins_earned} JC
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  entry.activities?.category === 'Academic'
                    ? 'bg-blue-100 text-blue-700'
                    : entry.activities?.category === 'Non-Academic'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-amber-100 text-amber-700'
                }`}>
                  {entry.activities?.category || 'Other'}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-500">No recent contributions.</p>
          )}
        </div>
      </div>
    </div>
  );
}
