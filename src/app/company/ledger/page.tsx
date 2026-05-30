import { supabase } from '@/lib/supabase';
import SubmitActivityModal from '@/components/company/SubmitActivityModal';
import { getUserRoleAndData } from '@/lib/auth';

export const revalidate = 0;

export default async function CompanyLedger() {
  const { companyId } = await getUserRoleAndData();
  const CURRENT_COMPANY_ID = companyId;

  // Fetch ledger entries
  const { data: ledgerEntries } = await supabase
    .from('jcoin_ledger')
    .select(`
      id,
      date,
      description,
      coins_earned,
      coins_used,
      status,
      jcoin_rules ( activity_name )
    `)
    .eq('company_id', CURRENT_COMPANY_ID)
    .order('date', { ascending: false });

  let runningBalance = 0;
  
  // Calculate running balances (assuming chronological processing, so let's reverse to calc)
  const entriesWithBalance = (ledgerEntries || []).slice().reverse().map(entry => {
    if (entry.status === 'approved') {
      runningBalance += (entry.coins_earned || 0) - (entry.coins_used || 0);
    }
    return { ...entry, balance: runningBalance };
  }).reverse(); // Reverse back for display (newest first)

  const totalEarned = ledgerEntries?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.coins_earned || 0), 0) || 0;
  const totalUsed = ledgerEntries?.filter(e => e.status === 'approved').reduce((sum, e) => sum + (e.coins_used || 0), 0) || 0;
  const currentBalance = totalEarned - totalUsed;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">My J-Coin Ledger</h1>
        <div className="flex gap-3">
          <button className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg font-medium transition-colors">
            Export PDF
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Submit Activity
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-emerald-600 p-6 rounded-2xl shadow-md text-white flex flex-col justify-between">
          <p className="text-emerald-100 font-medium mb-2">Total Balance</p>
          <h3 className="text-4xl font-bold">{currentBalance.toLocaleString()} <span className="text-lg font-normal text-emerald-200">JC</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-slate-500 font-medium mb-2">Total Earned YTD</p>
          <h3 className="text-3xl font-bold text-slate-800">{totalEarned.toLocaleString()} <span className="text-lg font-normal text-slate-400">JC</span></h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <p className="text-slate-500 font-medium mb-2">Total Used YTD</p>
          <h3 className="text-3xl font-bold text-slate-800">{totalUsed.toLocaleString()} <span className="text-lg font-normal text-slate-400">JC</span></h3>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-8">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-700">Transaction History</h3>
          <select className="text-sm border-none bg-transparent font-medium text-slate-600 focus:ring-0 cursor-pointer">
            <option>All Time</option>
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <th className="p-4">Date</th>
              <th className="p-4">Activity Description</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Earned</th>
              <th className="p-4 text-right">Used</th>
              <th className="p-4 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {entriesWithBalance.map((tx: any) => (
              <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-600">
                  {new Date(tx.date).toLocaleDateString()}
                </td>
                <td className="p-4 text-slate-800 font-medium">
                  {tx.description || tx.jcoin_rules?.activity_name || 'System Action'}
                </td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    tx.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                    tx.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tx.status?.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-4 text-right font-semibold text-emerald-600">
                  {tx.coins_earned > 0 ? `+${tx.coins_earned.toLocaleString()}` : '-'}
                </td>
                <td className="p-4 text-right font-semibold text-red-500">
                  {tx.coins_used > 0 ? `-${tx.coins_used.toLocaleString()}` : '-'}
                </td>
                <td className="p-4 text-right font-bold text-slate-800">
                  {tx.status === 'approved' ? tx.balance.toLocaleString() : 'N/A'}
                </td>
              </tr>
            ))}
            
            {entriesWithBalance.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  No transactions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
