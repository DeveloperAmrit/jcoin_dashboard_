import { supabase } from '@/lib/supabase';
import AddCompanyModal from '@/components/admin/AddCompanyModal';
import CompanyActions from '@/components/admin/CompanyActions';
import { computeTarget, getCurrentTermYear } from '@/lib/jcoin-utils';
import type { Company } from '@/lib/types';

export const dynamic = 'force-dynamic';

const CATEGORY_BADGE: Record<string, string> = {
  S1: 'bg-sky-100 text-sky-700 border-sky-200',
  S2: 'bg-violet-100 text-violet-700 border-violet-200',
  L1: 'bg-amber-100 text-amber-700 border-amber-200',
};

export default async function AdminCompanies() {
  const { data: companies } = await supabase
    .from('companies')
    .select('*')
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Companies Directory</h1>
        <AddCompanyModal />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4">S.No</th>
                <th className="p-4">Company</th>
                <th className="p-4">Category</th>
                <th className="p-4">Term</th>
                <th className="p-4">Room</th>
                <th className="p-4">Mode</th>
                <th className="p-4">Area (sq ft)</th>
                <th className="p-4">Target (JC/yr)</th>
                <th className="p-4">Current Term Year</th>
                <th className="p-4">Associated Professors</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {companies?.map((company: Company, index: number) => {
                const target = computeTarget(company);
                const termYear = getCurrentTermYear(company);
                const professors: string[] = company.associated_professors ?? [];

                return (
                  <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-500 font-medium">{index + 1}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{company.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{company.contact_email}</div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                          CATEGORY_BADGE[company.category] ?? 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {company.category ?? '—'}
                      </span>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="text-xs text-slate-500">
                        {new Date(company.agreement_start_date).toLocaleDateString()} –{' '}
                        {new Date(company.agreement_end_date).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{company.term_of_contract} yr(s)</div>
                    </td>
                    <td className="p-4 text-slate-600">{company.room_allocated || '—'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          company.mode_of_joining === 'online'
                            ? 'bg-violet-100 text-violet-700'
                            : 'bg-cyan-100 text-cyan-700'
                        }`}
                      >
                        {company.mode_of_joining}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700 font-medium">
                      {company.mode_of_joining === 'offline' ? company.area_occupied : '—'}
                    </td>
                    <td className="p-4 font-bold text-slate-800">{target}</td>
                    <td className="p-4 text-slate-600">Year {termYear}</td>
                    <td className="p-4 text-slate-600 max-w-[200px]">
                      {professors.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {professors.map((prof, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-medium"
                            >
                              {prof}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">None</span>
                      )}
                    </td>
                    <td className="p-4">
                      <CompanyActions company={company} />
                    </td>
                  </tr>
                );
              })}

              {(!companies || companies.length === 0) && (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500">
                    No companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
