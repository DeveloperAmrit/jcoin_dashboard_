'use client';

import { useState, useEffect } from 'react';
import { addContribution } from '@/app/admin/actions';
import type { Activity, Company, Contribution, ActivityCategory } from '@/lib/types';
import {
  computeTarget,
  getCurrentTermYear,
  computeCategoryEarnings,
  checkCaps,
  filterContributionsByTermYear,
} from '@/lib/jcoin-utils';

interface Props {
  companies: Company[];
  activities: Activity[];
  contributions: Contribution[];
  preSelectedCompanyId?: string;
  preSelectedActivityId?: string;
  onClose: () => void;
}

export default function AddContributionModal({
  companies,
  activities,
  contributions,
  preSelectedCompanyId,
  preSelectedActivityId,
  onClose,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [companyId, setCompanyId] = useState(preSelectedCompanyId || '');
  const [activityId, setActivityId] = useState(preSelectedActivityId || '');
  const [amount, setAmount] = useState(0);

  const selectedCompany = companies.find((c) => c.id === companyId);
  const selectedActivity = activities.find((a) => a.id === activityId);
  const previewJCoins = selectedActivity ? amount * selectedActivity.rate : 0;

  // Check cap warnings when company or activity changes
  useEffect(() => {
    if (!selectedCompany || !selectedActivity) {
      setWarning('');
      return;
    }

    const target = computeTarget(selectedCompany);
    const termYear = getCurrentTermYear(selectedCompany);
    const termContributions = filterContributionsByTermYear(
      contributions.filter((c) => c.company_id === companyId),
      termYear
    );
    const earnings = computeCategoryEarnings(termContributions, activities);
    const caps = checkCaps(earnings, target);

    const category = selectedActivity.category;
    if (category === 'Non-Academic' && caps.nonAcademicExceeded) {
      setWarning(
        `⚠️ Non-Academic cap already exceeded! Earned ${caps.nonAcademicEarned} JC of ${caps.nonAcademicCap} JC cap (50% of ${target} target).`
      );
    } else if (category === 'Sponsorship' && caps.sponsorshipExceeded) {
      setWarning(
        `⚠️ Sponsorship cap already exceeded! Earned ${caps.sponsorshipEarned} JC of ${caps.sponsorshipCap} JC cap (10% of ${target} target).`
      );
    } else {
      setWarning('');
    }
  }, [companyId, activityId, selectedCompany, selectedActivity, contributions, activities]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    // Add computed term_year
    if (selectedCompany) {
      const termYear = getCurrentTermYear(selectedCompany);
      formData.set('term_year', String(termYear));
    }

    try {
      const result = await addContribution(formData);

      // Post-submission cap check
      if (selectedCompany && selectedActivity) {
        const target = computeTarget(selectedCompany);
        const termYear = getCurrentTermYear(selectedCompany);
        const termContributions = filterContributionsByTermYear(
          contributions.filter((c) => c.company_id === companyId),
          termYear
        );

        // Add the new contribution to the check
        const newContribution: Contribution = {
          id: 'temp',
          company_id: companyId,
          activity_id: activityId,
          amount,
          jcoins_earned: result.jcoins_earned || previewJCoins,
          date: formData.get('date') as string,
          notes: null,
          term_year: termYear,
          created_at: new Date().toISOString(),
        };

        const allContributions = [...termContributions, newContribution];
        const newEarnings = computeCategoryEarnings(allContributions, activities);
        const newCaps = checkCaps(newEarnings, target);

        const cat = selectedActivity.category as ActivityCategory;
        if (cat === 'Non-Academic' && newCaps.nonAcademicExceeded) {
          alert(
            `⚠️ Warning: Non-Academic cap exceeded!\n${selectedCompany.name} has earned ${newCaps.nonAcademicEarned} JC in Non-Academic, exceeding the ${newCaps.nonAcademicCap} JC cap.`
          );
        } else if (cat === 'Sponsorship' && newCaps.sponsorshipExceeded) {
          alert(
            `⚠️ Warning: Sponsorship cap exceeded!\n${selectedCompany.name} has earned ${newCaps.sponsorshipEarned} JC in Sponsorship, exceeding the ${newCaps.sponsorshipCap} JC cap.`
          );
        }
      }

      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to add contribution');
    } finally {
      setIsLoading(false);
    }
  }

  // Group activities by category for the dropdown
  const groupedActivities = {
    Academic: activities.filter((a) => a.category === 'Academic'),
    'Non-Academic': activities.filter((a) => a.category === 'Non-Academic'),
    Sponsorship: activities.filter((a) => a.category === 'Sponsorship'),
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">Add Contribution</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
          )}

          {warning && (
            <div className="p-3 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200">
              {warning}
            </div>
          )}

          {/* Company Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Company *</label>
            {preSelectedCompanyId ? (
              <>
                <input type="hidden" name="company_id" value={companyId} />
                <div className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-700 font-medium">
                  {selectedCompany?.name || 'Unknown'}
                </div>
              </>
            ) : (
              <select
                required name="company_id" value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select company…</option>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Activity Selector */}
          <div>
            <label className="block text-sm font-medium mb-1">Activity *</label>
            {preSelectedActivityId ? (
              <>
                <input type="hidden" name="activity_id" value={activityId} />
                <div className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 text-slate-700 font-medium text-sm">
                  {selectedActivity?.title || 'Unknown'}
                </div>
              </>
            ) : (
              <select
                required name="activity_id" value={activityId}
                onChange={(e) => setActivityId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">Select activity…</option>
                {Object.entries(groupedActivities).map(([category, acts]) => (
                  <optgroup key={category} label={category}>
                    {acts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.title} ({a.rate} JC / {a.unit_label || a.unit})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount {selectedActivity ? `(${selectedActivity.unit_label || selectedActivity.unit})` : ''} *
            </label>
            <input
              required name="amount" type="number" step="any" min="0"
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* J-Coins Preview */}
          {selectedActivity && amount > 0 && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-emerald-700">J-Coins to be earned</span>
                <span className="text-2xl font-bold text-emerald-800">
                  {previewJCoins.toLocaleString()} JC
                </span>
              </div>
              <p className="text-xs text-emerald-600 mt-1">
                {amount} × {selectedActivity.rate} JC per {selectedActivity.unit_label || selectedActivity.unit}
              </p>
            </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-sm font-medium mb-1">Date *</label>
            <input
              required name="date" type="date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <input
              name="notes" type="text" placeholder="Optional description"
              className="w-full border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="pt-4 flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : 'Save Contribution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
