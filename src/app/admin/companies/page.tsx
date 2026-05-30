import { supabase } from '@/lib/supabase';
import AddCompanyModal from '@/components/admin/AddCompanyModal';
import CompanyActions from '@/components/admin/CompanyActions';

export const revalidate = 0;

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
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Company Details</th>
              <th className="p-4">Contact Person</th>
              <th className="p-4">Target (JC/yr)</th>
              <th className="p-4">Agreement Period</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {companies?.map((company: any) => (
              <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-800">{company.name}</div>
                  <div className="text-xs text-slate-500 mt-1">{company.id}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-slate-700">{company.contact_person}</div>
                  <div className="text-slate-500">{company.contact_email}</div>
                </td>
                <td className="p-4 font-semibold text-slate-700">
                  {company.min_annual_jcoin_target > 0 ? company.min_annual_jcoin_target.toLocaleString() : 'N/A'}
                </td>
                <td className="p-4 text-slate-600">
                  {company.agreement_start_date ? new Date(company.agreement_start_date).toLocaleDateString() : 'N/A'} - 
                  {company.agreement_end_date ? new Date(company.agreement_end_date).toLocaleDateString() : 'N/A'}
                </td>
                <td className="p-4">
                  <CompanyActions company={company} />
                </td>
              </tr>
            ))}
            
            {(!companies || companies.length === 0) && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No companies found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
