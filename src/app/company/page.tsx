import { supabase } from '@/lib/supabase';
import { getUserRoleAndData } from '@/lib/auth';

export const revalidate = 0;

export default async function CompanyDashboard() {
  const { companyId } = await getUserRoleAndData();
  const CURRENT_COMPANY_ID = companyId;

  // Fetch company details
  const { data: company } = await supabase
    .from('companies')
    .select('name, min_annual_jcoin_target, agreement_end_date')
    .eq('id', CURRENT_COMPANY_ID)
    .single();

  // Fetch MoU status
  const { data: mou } = await supabase
    .from('mou_documents')
    .select('status, created_at')
    .eq('company_id', CURRENT_COMPANY_ID)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch Ledger totals
  const { data: ledgerEntries } = await supabase
    .from('jcoin_ledger')
    .select('coins_earned, coins_used, status')
    .eq('company_id', CURRENT_COMPANY_ID);

  const approvedEntries = ledgerEntries?.filter(e => e.status === 'approved') || [];
  const pendingEntries = ledgerEntries?.filter(e => e.status === 'pending_approval') || [];

  const totalEarned = approvedEntries.reduce((sum, e) => sum + (e.coins_earned || 0), 0);
  const totalUsed = approvedEntries.reduce((sum, e) => sum + (e.coins_used || 0), 0);
  const totalPending = pendingEntries.reduce((sum, e) => sum + (e.coins_earned || 0), 0);

  const annualTarget = company?.min_annual_jcoin_target || 0;
  const currentDeficit = Math.max(0, annualTarget - totalEarned);
  const targetCompletedPercent = annualTarget > 0 ? Math.min(100, Math.round((totalEarned / annualTarget) * 100)) : 0;

  const kpis = [
    { label: 'Annual Target', value: annualTarget.toLocaleString(), trend: company?.agreement_end_date ? `Due by ${new Date(company.agreement_end_date).toLocaleDateString()}` : 'No target set' },
    { label: 'Coins Earned', value: totalEarned.toLocaleString(), trend: `${targetCompletedPercent}% completed` },
    { label: 'Pending Approvals', value: totalPending.toLocaleString(), trend: `${pendingEntries.length} activities under review` },
    { label: 'Current Deficit', value: currentDeficit.toLocaleString(), trend: currentDeficit > 0 ? 'Action needed' : 'Target met' },
  ];

  const mouStatusDisplay = mou?.status?.replace('_', ' ') || 'Not Submitted';
  const isMouActive = mou?.status === 'approved';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">{company?.name || 'My Dashboard'}</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20">
          Submit J-Coins Activity
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
            <p className={`text-xs font-medium mt-4 ${kpi.trend.includes('Action') ? 'text-amber-500' : 'text-slate-400'}`}>
              {kpi.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[300px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4">MoU Status</h2>
          
          <div className={`${isMouActive ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} border rounded-xl p-4 flex items-center gap-4`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isMouActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
              {isMouActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className={`font-semibold capitalize ${isMouActive ? 'text-emerald-900' : 'text-amber-900'}`}>
                {mouStatusDisplay}
              </h3>
              <p className={`text-sm ${isMouActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                {company?.agreement_end_date ? `Valid until ${new Date(company.agreement_end_date).toLocaleDateString()}` : 'Please contact admin'}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 min-h-[300px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Upcoming Deadlines</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4">
              <div>
                <p className="font-medium text-slate-800">Q3 Engagement Report</p>
                <p className="text-sm text-slate-500">Submit proofs for Q3 activities</p>
              </div>
              <span className="text-sm font-semibold text-amber-500 bg-amber-50 px-3 py-1 rounded-full">In 14 days</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
