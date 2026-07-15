'use client';

import { useState } from 'react';
import { addActivity } from '@/app/admin/actions';

const UNIT_OPTIONS = [
  { value: 'perTenLakhPaid', label: 'Per ₹10L paid' },
  { value: 'perLakhPaid', label: 'Per ₹1L paid' },
  { value: 'perYear', label: 'Per year' },
  { value: 'perHour', label: 'Per hour' },
  { value: 'annually', label: 'Annually' },
  { value: 'perGraduateHired', label: 'Per graduate hired' },
  { value: 'perStudentPerMonth', label: 'Per student per month' },
  { value: 'perFiveThousandPaid', label: 'Per ₹5,000 paid' },
  { value: 'perTenThousandPaid', label: 'Per ₹10,000 paid' },
];

export default function AddActivityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    // Add unit_label from the selected unit option
    const unitOption = UNIT_OPTIONS.find((u) => u.value === selectedUnit);
    if (unitOption) {
      formData.set('unit_label', unitOption.label);
    }

    try {
      await addActivity(formData);
      setIsOpen(false);
      setSelectedUnit('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add activity');
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
        Add Custom Activity
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Add Custom Activity</h2>
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
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  required name="title" type="text"
                  placeholder="e.g., Guest Lecture Program"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <input
                  name="description" type="text"
                  placeholder="Optional description"
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    required name="category"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select…</option>
                    <option value="Academic">Academic</option>
                    <option value="Non-Academic">Non-Academic</option>
                    <option value="Sponsorship">Sponsorship</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate (JC per unit) *</label>
                  <input
                    required name="rate" type="number" step="0.5" min="0"
                    className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Unit *</label>
                <select
                  required name="unit" value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="">Select unit…</option>
                  {UNIT_OPTIONS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
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
                  {isLoading ? 'Saving...' : 'Save Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
