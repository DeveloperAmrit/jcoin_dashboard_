'use client';

import { useState } from 'react';
import { addCompany } from '@/app/admin/actions';

export default function AddCompanyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('offline');
  const [area, setArea] = useState(0);
  const [term, setTerm] = useState(1);
  const [startDate, setStartDate] = useState('');

  // Compute target preview
  const computedTarget = mode === 'online' ? 100 : Math.ceil(area / 5);

  // Compute end date preview
  const computedEndDate = startDate
    ? (() => {
        const d = new Date(startDate);
        d.setFullYear(d.getFullYear() + term);
        return d.toISOString().split('T')[0];
      })()
    : '';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    try {
      await addCompany(formData);
      setIsOpen(false);
      // Reset form state
      setMode('offline');
      setArea(0);
      setTerm(1);
      setStartDate('');
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
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm shadow-blue-500/20"
      >
        Add New Company
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-slate-800">Add New Company</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xl"
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
                  <label className="block text-sm font-medium mb-1">Term of Contract (years) *</label>
                  <input
                    required name="term_of_contract" type="number" min={1} defaultValue={1}
                    onChange={(e) => setTerm(parseInt(e.target.value) || 1)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date *</label>
                  <input
                    required name="agreement_start_date" type="date"
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {computedEndDate && (
                <div className="text-sm text-slate-500 bg-slate-50 p-3 rounded-lg">
                  <span className="font-medium">End Date:</span> {new Date(computedEndDate).toLocaleDateString()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Mode of Joining *</label>
                  <select
                    name="mode_of_joining" value={mode}
                    onChange={(e) => setMode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="offline">Offline</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Room Allocated</label>
                  <input name="room_allocated" type="text" placeholder="e.g. Room 204" className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              {mode === 'offline' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Area Occupied (sq. ft.) *</label>
                  <input
                    required={mode === 'offline'} name="area_occupied" type="number" min={0} step="any" defaultValue={0}
                    onChange={(e) => setArea(parseFloat(e.target.value) || 0)}
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              )}

              {/* Computed Target Preview */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-blue-700">Annual J-Coin Target</span>
                  <span className="text-2xl font-bold text-blue-800">{computedTarget} JC</span>
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {mode === 'online'
                    ? 'Fixed 100 JC for online companies'
                    : `${area} sq ft ÷ 5 = ${computedTarget} JC`}
                </p>
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
