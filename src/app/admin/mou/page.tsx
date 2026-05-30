import { supabase } from '@/lib/supabase';
import AddCompanyModal from '@/components/admin/AddCompanyModal';
interface CompanyWithMoU {
  id: string;
  name: string;
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  mou_documents: { status: string }[] | null;
}

export const revalidate = 0;

export default async function AdminMoU() {
  // Fetch companies and their MoU documents
  const { data: companies } = await supabase
    .from('companies')
    .select(`
      id,
      name,
      agreement_start_date,
      agreement_end_date,
      mou_documents ( status )
    `)
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">MoU Management</h1>
        <AddCompanyModal />
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <th className="p-4">Company Name</th>
              <th className="p-4">MoU Status</th>
              <th className="p-4">Start Date</th>
              <th className="p-4">End Date</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {companies?.map((company: CompanyWithMoU) => {
              // Assume the latest MoU document is the first one if multiple exist, or just check [0]
              const mouStatus = company.mou_documents?.[0]?.status || 'Not Submitted';
              const statusDisplay = mouStatus.replace('_', ' ');
              
              return (
                <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{company.name}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                      statusDisplay === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                      statusDisplay === 'under review' ? 'bg-blue-100 text-blue-700' :
                      statusDisplay === 'clarification needed' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {statusDisplay}
                    </span>
                  </td>
                  <td className="p-4 text-slate-600">{company.agreement_start_date || 'N/A'}</td>
                  <td className="p-4 text-slate-600">{company.agreement_end_date || 'N/A'}</td>
                  <td className="p-4 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">View</button>
                  </td>
                </tr>
              );
            })}
            
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
