'use client';

import { useState, useMemo } from 'react';
import type { Company, Activity, Contribution, ActivityCategory } from '@/lib/types';
import {
  computeTarget,
  getCurrentTermYear,
  computeCategoryEarnings,
  checkCaps,
  filterContributionsByTermYear,
  groupContributionsByActivity,
} from '@/lib/jcoin-utils';
import AddContributionModal from './AddContributionModal';

interface Props {
  companies: Company[];
  activities: Activity[];
  contributions: Contribution[];
}

type Tab = 'overview' | 'breakdown';
type ValueMode = 'jcoins' | 'amount';

export default function JCoinSheet({ companies, activities, contributions }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [preSelectedCompanyId, setPreSelectedCompanyId] = useState<string | undefined>();
  const [preSelectedActivityId, setPreSelectedActivityId] = useState<string | undefined>();
  const [valueMode, setValueMode] = useState<ValueMode>('jcoins');

  // Group activities by category
  const academicActivities = activities.filter((a) => a.category === 'Academic');
  const nonAcademicActivities = activities.filter((a) => a.category === 'Non-Academic');
  const sponsorshipActivities = activities.filter((a) => a.category === 'Sponsorship');

  // Compute data for each company
  const companyData = useMemo(() => {
    return companies.map((company) => {
      const target = computeTarget(company);
      const termYear = getCurrentTermYear(company);
      const companyContribs = contributions.filter((c) => c.company_id === company.id);
      const termContribs = filterContributionsByTermYear(companyContribs, termYear);
      const earnings = computeCategoryEarnings(termContribs, activities);
      const caps = checkCaps(earnings, target);
      const byActivity = groupContributionsByActivity(termContribs);

      return {
        company,
        target,
        termYear,
        earnings,
        caps,
        byActivity,
        termContribs,
      };
    });
  }, [companies, contributions, activities]);

  function openContributionModal(companyId?: string, activityId?: string) {
    setPreSelectedCompanyId(companyId);
    setPreSelectedActivityId(activityId);
    setShowContributionModal(true);
  }

  function closeContributionModal() {
    setShowContributionModal(false);
    setPreSelectedCompanyId(undefined);
    setPreSelectedActivityId(undefined);
  }

  return (
    <div className="space-y-4">
      {/* Tab Bar (Chrome-style) */}
      <div className="flex items-center justify-between">
        <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'overview'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Company Overview
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'breakdown'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Activity Breakdown
          </button>
        </div>

        <div className="flex items-center gap-3">
          {activeTab === 'breakdown' && (
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setValueMode('jcoins')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  valueMode === 'jcoins' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                J-Coins
              </button>
              <button
                onClick={() => setValueMode('amount')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  valueMode === 'amount' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Amount (₹)
              </button>
            </div>
          )}
          <button
            onClick={() => openContributionModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-500/20"
          >
            + Add Contribution
          </button>
        </div>
      </div>

      {/* Sheet Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'overview' ? (
            <OverviewTab
              companyData={companyData}
              onCellClick={openContributionModal}
            />
          ) : (
            <BreakdownTab
              companyData={companyData}
              academicActivities={academicActivities}
              nonAcademicActivities={nonAcademicActivities}
              sponsorshipActivities={sponsorshipActivities}
              valueMode={valueMode}
              onCellClick={openContributionModal}
            />
          )}
        </div>
      </div>

      {/* Contribution Modal */}
      {showContributionModal && (
        <AddContributionModal
          companies={companies}
          activities={activities}
          contributions={contributions}
          preSelectedCompanyId={preSelectedCompanyId}
          preSelectedActivityId={preSelectedActivityId}
          onClose={closeContributionModal}
        />
      )}
    </div>
  );
}

// ============================================
// Tab 1: Company Overview
// ============================================
interface CompanyRow {
  company: Company;
  target: number;
  termYear: number;
  earnings: { academic: number; nonAcademic: number; sponsorship: number; total: number };
  caps: ReturnType<typeof checkCaps>;
  byActivity: Map<string, { totalAmount: number; totalJCoins: number }>;
  termContribs: Contribution[];
}

function OverviewTab({
  companyData,
  onCellClick,
}: {
  companyData: CompanyRow[];
  onCellClick: (companyId: string) => void;
}) {
  return (
    <table className="w-full text-left border-collapse min-w-[1000px]">
      <thead>
        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <th className="p-3 sticky left-0 bg-slate-50 z-10">S.No</th>
          <th className="p-3 sticky left-[52px] bg-slate-50 z-10 min-w-[180px]">Company</th>
          <th className="p-3">Term of Contract</th>
          <th className="p-3">Room</th>
          <th className="p-3">Mode</th>
          <th className="p-3">Area (sq ft)</th>
          <th className="p-3 bg-blue-50 text-blue-700">JC Required / Year</th>
          <th className="p-3 bg-blue-50 text-blue-700">Earned — Academic</th>
          <th className="p-3 bg-emerald-50 text-emerald-700">
            <div>Earned — Non-Academic</div>
            <div className="text-[10px] font-normal normal-case">(50% cap)</div>
          </th>
          <th className="p-3 bg-amber-50 text-amber-700">
            <div>Earned — Sponsorship</div>
            <div className="text-[10px] font-normal normal-case">(10% cap)</div>
          </th>
          <th className="p-3 bg-red-50 text-red-700">Unable to Earn</th>
          <th className="p-3">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {companyData.map((row, index) => {
          const { company, target, earnings, caps } = row;
          return (
            <tr key={company.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="p-3 text-slate-500 font-medium sticky left-0 bg-white z-10">
                {index + 1}
              </td>
              <td className="p-3 sticky left-[52px] bg-white z-10">
                <div className="font-bold text-slate-800">{company.name}</div>
              </td>
              <td className="p-3 text-slate-600 text-xs">
                {new Date(company.agreement_start_date).toLocaleDateString()} –{' '}
                {new Date(company.agreement_end_date).toLocaleDateString()}
              </td>
              <td className="p-3 text-slate-600">{company.room_allocated || '—'}</td>
              <td className="p-3">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    company.mode_of_joining === 'online'
                      ? 'bg-violet-100 text-violet-700'
                      : 'bg-cyan-100 text-cyan-700'
                  }`}
                >
                  {company.mode_of_joining}
                </span>
              </td>
              <td className="p-3 text-slate-700">{company.area_occupied || '—'}</td>
              <td className="p-3 font-bold text-blue-800 bg-blue-50/50">{target}</td>
              <td className="p-3 font-semibold text-blue-700 bg-blue-50/30">
                {earnings.academic || '—'}
              </td>
              <td
                className={`p-3 font-semibold bg-emerald-50/30 ${
                  caps.nonAcademicExceeded ? 'text-red-600' : 'text-emerald-700'
                }`}
              >
                {earnings.nonAcademic || '—'}
                {caps.nonAcademicExceeded && (
                  <span className="ml-1 text-[10px] text-red-500">⚠️ exceeded</span>
                )}
              </td>
              <td
                className={`p-3 font-semibold bg-amber-50/30 ${
                  caps.sponsorshipExceeded ? 'text-red-600' : 'text-amber-700'
                }`}
              >
                {earnings.sponsorship || '—'}
                {caps.sponsorshipExceeded && (
                  <span className="ml-1 text-[10px] text-red-500">⚠️ exceeded</span>
                )}
              </td>
              <td className="p-3 font-semibold text-red-600 bg-red-50/30">
                {caps.deficit > 0 ? caps.deficit : '—'}
              </td>
              <td className="p-3">
                <button
                  onClick={() => onCellClick(company.id)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors"
                >
                  + Add
                </button>
              </td>
            </tr>
          );
        })}

        {companyData.length === 0 && (
          <tr>
            <td colSpan={12} className="p-8 text-center text-slate-500">
              No companies found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ============================================
// Tab 2: Activity Breakdown
// ============================================
function BreakdownTab({
  companyData,
  academicActivities,
  nonAcademicActivities,
  sponsorshipActivities,
  valueMode,
  onCellClick,
}: {
  companyData: CompanyRow[];
  academicActivities: Activity[];
  nonAcademicActivities: Activity[];
  sponsorshipActivities: Activity[];
  valueMode: ValueMode;
  onCellClick: (companyId: string, activityId: string) => void;
}) {
  const allActivities = [...academicActivities, ...nonAcademicActivities, ...sponsorshipActivities];

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        {/* Category header row */}
        <tr className="border-b border-slate-200">
          <th
            className="p-2 bg-slate-50 text-xs font-bold text-slate-600 sticky left-0 z-10 min-w-[160px]"
            rowSpan={2}
          >
            Company
          </th>
          {academicActivities.length > 0 && (
            <th
              colSpan={academicActivities.length}
              className="p-2 bg-blue-50 text-center text-xs font-bold text-blue-700 border-l border-slate-200"
            >
              Academic / R&D {valueMode === 'amount' ? '(Amount in Lakhs)' : '(J-Coins)'}
            </th>
          )}
          {nonAcademicActivities.length > 0 && (
            <th
              colSpan={nonAcademicActivities.length}
              className="p-2 bg-emerald-50 text-center text-xs font-bold text-emerald-700 border-l border-slate-200"
            >
              Non-Academic {valueMode === 'amount' ? '(Amount)' : '(J-Coins)'}
            </th>
          )}
          {sponsorshipActivities.length > 0 && (
            <th
              colSpan={sponsorshipActivities.length}
              className="p-2 bg-amber-50 text-center text-xs font-bold text-amber-700 border-l border-slate-200"
            >
              Sponsorship {valueMode === 'amount' ? '(Amount)' : '(J-Coins)'}
            </th>
          )}
        </tr>
        {/* Activity title header row */}
        <tr className="border-b border-slate-200">
          {allActivities.map((activity) => {
            const bgColor =
              activity.category === 'Academic'
                ? 'bg-blue-50/50'
                : activity.category === 'Non-Academic'
                  ? 'bg-emerald-50/50'
                  : 'bg-amber-50/50';
            return (
              <th
                key={activity.id}
                className={`p-2 text-[10px] font-medium text-slate-600 border-l border-slate-100 min-w-[120px] max-w-[160px] ${bgColor}`}
                title={activity.title}
              >
                <div className="truncate">{activity.title}</div>
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {companyData.map((row) => {
          const { company, byActivity } = row;
          return (
            <tr key={company.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="p-2 font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-100 text-xs">
                {company.name}
              </td>
              {allActivities.map((activity) => {
                const data = byActivity.get(activity.id);
                const value = data
                  ? valueMode === 'jcoins'
                    ? data.totalJCoins
                    : data.totalAmount
                  : null;

                const hasValue = value !== null && value > 0;
                const bgColor = hasValue
                  ? activity.category === 'Academic'
                    ? 'bg-cyan-50'
                    : activity.category === 'Non-Academic'
                      ? 'bg-emerald-50'
                      : 'bg-amber-50'
                  : '';

                return (
                  <td
                    key={activity.id}
                    className={`p-2 text-center text-xs border-l border-slate-100 cursor-pointer hover:bg-blue-100/50 transition-colors ${bgColor}`}
                    onClick={() => onCellClick(company.id, activity.id)}
                    title={`Click to add contribution: ${company.name} → ${activity.title}`}
                  >
                    {hasValue ? (
                      <span className="font-semibold text-slate-800">
                        {valueMode === 'amount' ? value.toLocaleString() : value}
                      </span>
                    ) : null}
                  </td>
                );
              })}
            </tr>
          );
        })}

        {companyData.length === 0 && (
          <tr>
            <td colSpan={allActivities.length + 1} className="p-8 text-center text-slate-500">
              No companies found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
