'use client';

import { useState } from 'react';
import { editCompany } from '@/app/admin/actions';

interface Company {
  id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  agreement_start_date: string | null;
  agreement_end_date: string | null;
  min_annual_jcoin_target: number;
}

export default function EditCompanyModal({ company }: { company: Company }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      await editCompany(company.id, formData);
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to edit company');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
      >
        Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Edit Company</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
              {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}
              
              <div>
                <label className="block text-sm font-medium mb-1">Company Name *</label>
                <input required defaultValue={company.name} name="name" type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person *</label>
                  <input required defaultValue={company.contact_person} name="contact_person" type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email *</label>
                  <input required defaultValue={company.contact_email} name="contact_email" type="email" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input defaultValue={company.agreement_start_date || ''} name="agreement_start_date" type="date" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input defaultValue={company.agreement_end_date || ''} name="agreement_end_date" type="date" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Annual J-Coin Target</label>
                <input defaultValue={company.min_annual_jcoin_target} name="min_annual_jcoin_target" type="number" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
