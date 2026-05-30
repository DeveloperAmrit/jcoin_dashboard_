'use client';

import { useState } from 'react';
import { addCompany } from '@/app/admin/actions';

export default function AddCompanyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      await addCompany(formData);
      setIsOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add company');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
      >
        Add New Company
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Add New Company</h2>
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
                <input required name="name" type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Person *</label>
                  <input required name="contact_person" type="text" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Email *</label>
                  <input required name="contact_email" type="email" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input name="agreement_start_date" type="date" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input name="agreement_end_date" type="date" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Annual J-Coin Target</label>
                <input name="min_annual_jcoin_target" type="number" defaultValue={0} className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
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
                  {isLoading ? 'Saving...' : 'Save Company'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
