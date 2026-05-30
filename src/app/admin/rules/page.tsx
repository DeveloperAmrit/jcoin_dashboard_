import { supabase } from '@/lib/supabase';
import AddRuleModal from '@/components/admin/AddRuleModal';

interface Rule {
  id: string;
  activity_name: string;
  points_awarded: number;
  annual_cap: number | null;
  validity_months: number | null;
}

export const revalidate = 0;

export default async function AdminRules() {
  const { data: rules } = await supabase
    .from('jcoin_rules')
    .select('*')
    .order('activity_name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">J-Coin Rules Engine</h1>
        <AddRuleModal />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rules?.map((rule: Rule) => (
          <div key={rule.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-slate-800">{rule.activity_name}</h3>
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Points Awarded</span>
                <span className="font-medium text-slate-800">{rule.points_awarded}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-1">
                <span className="text-slate-500">Annual Cap</span>
                <span className="font-medium text-slate-800">{rule.annual_cap ? `${rule.annual_cap}/yr` : 'No limit'}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-slate-500">Validity</span>
                <span className="font-medium text-slate-800">{rule.validity_months ? `${rule.validity_months} months` : 'Forever'}</span>
              </div>
            </div>
          </div>
        ))}

        {(!rules || rules.length === 0) && (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-slate-100 text-slate-500">
            No rules found.
          </div>
        )}
      </div>
    </div>
  );
}
