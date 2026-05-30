import { supabase } from '@/lib/supabase';

export const revalidate = 0; // Disable cache for dashboard

export default async function AdminDashboard() {
  // Fetch total companies
  const { count: totalCompanies } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  // Fetch pending MoUs
  const { count: pendingMoUs } = await supabase
    .from('mou_documents')
    .select('*', { count: 'exact', head: true })
    .in('status', ['under_review', 'clarification_needed']);

  // Fetch total J-Coins issued
  const { data: ledgerEntries } = await supabase
    .from('jcoin_ledger')
    .select('coins_earned')
    .eq('status', 'approved');
  
  const totalCoinsIssued = ledgerEntries?.reduce((sum, entry) => sum + (entry.coins_earned || 0), 0) || 0;

  // Recent Activity
  const { data: recentActivity } = await supabase
    .from('jcoin_ledger')
    .select(`
      id,
      date,
      description,
      created_at,
      companies ( name )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  const kpis = [
    { label: 'Total Companies', value: totalCompanies?.toString() || '0', trend: 'Registered on platform' },
    { label: 'Pending MoUs', value: pendingMoUs?.toString() || '0', trend: pendingMoUs ? 'Requires action' : 'All caught up' },
    { label: 'Total J-Coins Issued', value: totalCoinsIssued.toLocaleString(), trend: 'Approved issuance' },
    { label: 'System Status', value: 'Active', trend: 'Operational' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20">
          Generate Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
              <h3 className="text-3xl font-bold text-slate-800">{kpi.value}</h3>
            </div>
            <p className={`text-xs font-medium mt-4 ${kpi.trend.includes('action') ? 'text-amber-500' : 'text-emerald-500'}`}>
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4">J-Coin Issuance Trend</h2>
          <div className="flex items-center justify-center h-[300px] text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
            Chart will be rendered here
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[400px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((activity: any) => (
                <div key={activity.id} className="flex gap-4 items-start border-b border-slate-50 pb-4 last:border-0">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {activity.companies?.name || 'A company'} - {activity.description}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(activity.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No recent activity.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
