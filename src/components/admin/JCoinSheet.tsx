'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Settings2, Calendar, ChevronDown, Check, Columns, Plus } from 'lucide-react';
import type { Company, Activity, Contribution } from '@/lib/types';
import {
  computeTarget,
  getCurrentFinancialYear,
  getPastFinancialYears,
  getTermYearEndingInSpecificFY,
  getTermYearForDate,
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

// Define available columns for Tab 1
const AVAILABLE_COLUMNS = [
  { id: 'term', label: 'Term of Contract' },
  { id: 'room', label: 'Room Allocated' },
  { id: 'mode', label: 'Mode of Joining' },
  { id: 'area', label: 'Area Occupied' },
  { id: 'target', label: 'JC Required / Year' },
  { id: 'academic', label: 'Earned — Academic' },
  { id: 'nonAcademic', label: 'Earned — Non-Academic' },
  { id: 'sponsorship', label: 'Earned — Sponsorship' },
  { id: 'deficit', label: 'Unable to Earn' },
];

export default function JCoinSheet({ companies, activities, contributions }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [showContributionModal, setShowContributionModal] = useState(false);
  const [preSelectedCompanyId, setPreSelectedCompanyId] = useState<string | undefined>();
  const [preSelectedActivityId, setPreSelectedActivityId] = useState<string | undefined>();
  
  // UI State
  const [valueMode, setValueMode] = useState<ValueMode>('jcoins');
  const [isColumnDropdownOpen, setIsColumnDropdownOpen] = useState(false);
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);
  
  const columnRef = useRef<HTMLDivElement>(null);
  const fyRef = useRef<HTMLDivElement>(null);

  // Financial Year Selection
  const allFinancialYears = useMemo(() => getPastFinancialYears(5), []);
  const [selectedFyIndex, setSelectedFyIndex] = useState(0);
  const selectedFy = allFinancialYears[selectedFyIndex];

  // Column Visibility Selection
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    term: true,
    room: true,
    mode: true,
    area: true,
    target: true,
    academic: true,
    nonAcademic: true,
    sponsorship: true,
    deficit: true,
  });

  const toggleColumn = (id: string) => {
    setVisibleColumns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnRef.current && !columnRef.current.contains(event.target as Node)) {
        setIsColumnDropdownOpen(false);
      }
      if (fyRef.current && !fyRef.current.contains(event.target as Node)) {
        setIsFyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Group activities
  const academicActivities = activities.filter((a) => a.category === 'Academic');
  const nonAcademicActivities = activities.filter((a) => a.category === 'Non-Academic');
  const sponsorshipActivities = activities.filter((a) => a.category === 'Sponsorship');

  // Compute data for each company based on selected FY
  const companyData = useMemo(() => {
    return companies
      .filter((company) => {
        const companyStart = new Date(company.agreement_start_date);
        const companyEnd = new Date(company.agreement_end_date!);
        // Check for date range overlap: StartA <= EndB && EndA >= StartB
        return companyStart <= selectedFy.end && companyEnd >= selectedFy.start;
      })
      .map((company) => {
        const target = computeTarget(company);
      
      // Determine the term year ending date within this FY
      const termYearEndingDate = getTermYearEndingInSpecificFY(company, selectedFy.startYear);
      
      // Determine which term year this corresponds to by checking the ending date or start of FY
      const referenceDate = termYearEndingDate || selectedFy.start;
      const termYear = getTermYearForDate(company, referenceDate);
      
      const companyContribs = contributions.filter((c) => c.company_id === company.id);
      const termContribs = filterContributionsByTermYear(companyContribs, termYear);
      const earnings = computeCategoryEarnings(termContribs, activities);
      const caps = checkCaps(earnings, target);
      const byActivity = groupContributionsByActivity(termContribs);

      return {
        company,
        target,
        termYear,
        termYearEndingDate,
        earnings,
        caps,
        byActivity,
        termContribs,
      };
    });
  }, [companies, contributions, activities, selectedFy]);

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
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Premium Toolbar */}
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-2 shadow-sm sticky top-0 z-40 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Chrome-style Tabs */}
        <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
              activeTab === 'overview'
                ? 'text-blue-700 bg-white shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <span className="relative z-10">Company Overview</span>
            {activeTab === 'overview' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50/30 -z-10" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative overflow-hidden ${
              activeTab === 'breakdown'
                ? 'text-blue-700 bg-white shadow-sm ring-1 ring-slate-900/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
            }`}
          >
            <span className="relative z-10">Activity Breakdown</span>
            {activeTab === 'breakdown' && (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50/30 -z-10" />
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end px-2">
          
          {/* FY Selector */}
          <div className="relative" ref={fyRef}>
            <button 
              onClick={() => setIsFyDropdownOpen(!isFyDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
            >
              <Calendar className="w-4 h-4 text-blue-500 group-hover:text-blue-600 transition-colors" />
              FY {selectedFy.label}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isFyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isFyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="p-1">
                  {allFinancialYears.map((fy, idx) => (
                    <button
                      key={fy.label}
                      onClick={() => { setSelectedFyIndex(idx); setIsFyDropdownOpen(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                        idx === selectedFyIndex ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      FY {fy.label}
                      {idx === selectedFyIndex && <Check className="w-4 h-4 text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tab Specific Controls */}
          {activeTab === 'overview' ? (
            <div className="relative" ref={columnRef}>
              <button 
                onClick={() => setIsColumnDropdownOpen(!isColumnDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm group"
              >
                <Columns className="w-4 h-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
                Columns
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isColumnDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isColumnDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                  <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/50">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Visible Columns</span>
                  </div>
                  <div className="max-h-64 overflow-y-auto p-1">
                    {AVAILABLE_COLUMNS.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors hover:bg-slate-50 text-slate-700 text-left"
                      >
                        <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center transition-colors ${
                          visibleColumns[col.id] ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
                        }`}>
                          {visibleColumns[col.id] && <Check className="w-3 h-3 text-white" />}
                        </div>
                        {col.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200/50 shadow-inner">
              <button
                onClick={() => setValueMode('jcoins')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  valueMode === 'jcoins' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                J-Coins
              </button>
              <button
                onClick={() => setValueMode('amount')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  valueMode === 'amount' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-slate-900/5' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                ₹ / Unit
              </button>
            </div>
          )}

          <button
            onClick={() => openContributionModal()}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Contribution</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Sheet Content Container */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden relative">
        <div className="overflow-x-auto min-h-[500px]">
          {activeTab === 'overview' ? (
            <OverviewTab
              companyData={companyData}
              visibleColumns={visibleColumns}
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
  termYearEndingDate: Date | null;
  earnings: { academic: number; nonAcademic: number; sponsorship: number; total: number };
  caps: ReturnType<typeof checkCaps>;
  byActivity: Map<string, { totalAmount: number; totalJCoins: number }>;
  termContribs: Contribution[];
}

function OverviewTab({
  companyData,
  visibleColumns,
  onCellClick,
}: {
  companyData: CompanyRow[];
  visibleColumns: Record<string, boolean>;
  onCellClick: (companyId: string) => void;
}) {
  return (
    <table className="w-full text-left border-collapse min-w-max">
      <thead>
        <tr className="bg-slate-50/80 backdrop-blur-md border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
          <th className="p-4 sticky left-0 bg-slate-50/95 backdrop-blur-md z-20 shadow-[1px_0_0_0_#e2e8f0]">S.No</th>
          <th className="p-4 sticky left-[60px] bg-slate-50/95 backdrop-blur-md z-20 min-w-[200px] shadow-[1px_0_0_0_#e2e8f0]">Company</th>
          
          <th className="p-4">Term Ending Date</th>
          <th className="p-4 bg-blue-50/50 text-blue-700">JC Earned (This Term)</th>

          {visibleColumns.term && <th className="p-4">Term</th>}
          {visibleColumns.room && <th className="p-4">Room</th>}
          {visibleColumns.mode && <th className="p-4">Mode</th>}
          {visibleColumns.area && <th className="p-4">Area (sq ft)</th>}
          
          {visibleColumns.target && <th className="p-4 bg-slate-100/50 text-slate-700">Target (JC/yr)</th>}
          
          {visibleColumns.academic && <th className="p-4 bg-blue-50/50 text-blue-700">Academic</th>}
          {visibleColumns.nonAcademic && (
            <th className="p-4 bg-emerald-50/50 text-emerald-700">
              <div className="flex flex-col">
                <span>Non-Academic</span>
                <span className="text-[9px] font-medium text-emerald-600/70">(50% cap)</span>
              </div>
            </th>
          )}
          {visibleColumns.sponsorship && (
            <th className="p-4 bg-amber-50/50 text-amber-700">
              <div className="flex flex-col">
                <span>Sponsorship</span>
                <span className="text-[9px] font-medium text-amber-600/70">(10% cap)</span>
              </div>
            </th>
          )}
          {visibleColumns.deficit && <th className="p-4 bg-red-50/50 text-red-700">Deficit</th>}
          
          <th className="p-4 sticky right-0 bg-slate-50/95 backdrop-blur-md z-20 shadow-[-1px_0_0_0_#e2e8f0] text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100/80 text-sm">
        {companyData.map((row, index) => {
          const { company, target, earnings, caps, termYearEndingDate } = row;
          return (
            <tr key={company.id} className="group hover:bg-blue-50/30 transition-colors duration-200">
              <td className="p-4 text-slate-400 font-medium sticky left-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 shadow-[1px_0_0_0_#e2e8f0]">
                {index + 1}
              </td>
              <td className="p-4 sticky left-[60px] bg-white group-hover:bg-blue-50/30 transition-colors z-10 shadow-[1px_0_0_0_#e2e8f0]">
                <div className="font-bold text-slate-800 tracking-tight">{company.name}</div>
              </td>
              
              <td className="p-4 font-medium text-slate-700">
                {termYearEndingDate ? (
                  <span className="px-2.5 py-1 bg-slate-100 rounded-md text-xs border border-slate-200">
                    {termYearEndingDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-slate-400 text-xs italic">N/A this FY</span>
                )}
              </td>
              
              <td className="p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black text-blue-600">{earnings.total}</span>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">JC</span>
                </div>
              </td>

              {visibleColumns.term && (
                <td className="p-4 text-slate-600 text-xs">
                  {new Date(company.agreement_start_date).getFullYear()} –{' '}
                  {new Date(company.agreement_end_date).getFullYear()}
                </td>
              )}
              {visibleColumns.room && <td className="p-4 text-slate-600 font-medium">{company.room_allocated || '—'}</td>}
              {visibleColumns.mode && (
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    company.mode_of_joining === 'online'
                      ? 'bg-violet-100 text-violet-700 border border-violet-200'
                      : 'bg-cyan-100 text-cyan-700 border border-cyan-200'
                  }`}>
                    {company.mode_of_joining}
                  </span>
                </td>
              )}
              {visibleColumns.area && <td className="p-4 text-slate-600 font-medium">{company.area_occupied || '—'}</td>}
              
              {visibleColumns.target && <td className="p-4 font-bold text-slate-700 bg-slate-50/30">{target}</td>}
              
              {visibleColumns.academic && <td className="p-4 font-semibold text-blue-600 bg-blue-50/10">{earnings.academic || '—'}</td>}
              {visibleColumns.nonAcademic && (
                <td className={`p-4 font-semibold bg-emerald-50/10 ${caps.nonAcademicExceeded ? 'text-red-500' : 'text-emerald-600'}`}>
                  {earnings.nonAcademic || '—'}
                  {caps.nonAcademicExceeded && <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-sm">CAP EXCEEDED</span>}
                </td>
              )}
              {visibleColumns.sponsorship && (
                <td className={`p-4 font-semibold bg-amber-50/10 ${caps.sponsorshipExceeded ? 'text-red-500' : 'text-amber-600'}`}>
                  {earnings.sponsorship || '—'}
                  {caps.sponsorshipExceeded && <span className="ml-1.5 text-[10px] font-bold text-red-500 bg-red-100 px-1.5 py-0.5 rounded-sm">CAP EXCEEDED</span>}
                </td>
              )}
              {visibleColumns.deficit && (
                <td className="p-4 font-bold text-red-500 bg-red-50/10">
                  {caps.deficit > 0 ? caps.deficit : '—'}
                </td>
              )}
              
              <td className="p-4 sticky right-0 bg-white group-hover:bg-blue-50/30 transition-colors z-10 shadow-[-1px_0_0_0_#e2e8f0] text-right">
                <button
                  onClick={() => onCellClick(company.id)}
                  className="text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm"
                >
                  Add
                </button>
              </td>
            </tr>
          );
        })}

        {companyData.length === 0 && (
          <tr>
            <td colSpan={14} className="p-12 text-center text-slate-400 bg-slate-50/50">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-slate-300" />
                </div>
                <p className="font-medium text-slate-500">No companies found for this period.</p>
              </div>
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
        <tr className="border-b border-slate-200 bg-slate-50">
          <th
            className="p-3 bg-white text-xs font-black text-slate-800 uppercase tracking-wider sticky left-0 z-20 shadow-[1px_0_0_0_#e2e8f0] min-w-[220px]"
            rowSpan={2}
          >
            Company
          </th>
          {academicActivities.length > 0 && (
            <th colSpan={academicActivities.length} className="p-2 bg-blue-100/50 text-center text-xs font-black text-blue-800 uppercase tracking-wider border-l border-slate-200">
              Academic / R&D
            </th>
          )}
          {nonAcademicActivities.length > 0 && (
            <th colSpan={nonAcademicActivities.length} className="p-2 bg-emerald-100/50 text-center text-xs font-black text-emerald-800 uppercase tracking-wider border-l border-slate-200">
              Non-Academic
            </th>
          )}
          {sponsorshipActivities.length > 0 && (
            <th colSpan={sponsorshipActivities.length} className="p-2 bg-amber-100/50 text-center text-xs font-black text-amber-800 uppercase tracking-wider border-l border-slate-200">
              Sponsorship
            </th>
          )}
        </tr>
        
        {/* Activity title header row */}
        <tr className="border-b border-slate-200 shadow-sm">
          {allActivities.map((activity) => {
            const isAcademic = activity.category === 'Academic';
            const isNonAcad = activity.category === 'Non-Academic';
            const bgColor = isAcademic ? 'bg-blue-50/80' : isNonAcad ? 'bg-emerald-50/80' : 'bg-amber-50/80';
            const textColor = isAcademic ? 'text-blue-700' : isNonAcad ? 'text-emerald-700' : 'text-amber-700';
            
            return (
              <th
                key={activity.id}
                className={`p-3 text-[10px] font-bold ${textColor} border-l border-slate-200 min-w-[140px] max-w-[180px] ${bgColor} align-top leading-tight`}
                title={activity.title}
              >
                <div className="line-clamp-3 mb-2">{activity.title}</div>
                <div className="inline-block px-1.5 py-0.5 rounded bg-white/60 text-[9px] font-semibold border border-black/5 opacity-80">
                  {activity.rate} JC / {activity.unit_label || activity.unit}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
      
      <tbody className="divide-y divide-slate-100/80 text-sm">
        {companyData.map((row) => {
          const { company, byActivity } = row;
          return (
            <tr key={company.id} className="group hover:bg-slate-50/50 transition-colors duration-150">
              <td className="p-3 font-bold text-slate-700 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-200 text-xs shadow-[1px_0_0_0_#e2e8f0]">
                {company.name}
              </td>
              
              {allActivities.map((activity) => {
                const data = byActivity.get(activity.id);
                const value = data ? (valueMode === 'jcoins' ? data.totalJCoins : data.totalAmount) : null;
                const hasValue = value !== null && value > 0;
                
                const isAcademic = activity.category === 'Academic';
                const isNonAcad = activity.category === 'Non-Academic';
                
                const baseBg = isAcademic ? 'hover:bg-blue-50/80' : isNonAcad ? 'hover:bg-emerald-50/80' : 'hover:bg-amber-50/80';
                const activeBg = isAcademic ? 'bg-blue-100/50' : isNonAcad ? 'bg-emerald-100/50' : 'bg-amber-100/50';
                const textColor = isAcademic ? 'text-blue-800' : isNonAcad ? 'text-emerald-800' : 'text-amber-800';
                
                return (
                  <td
                    key={activity.id}
                    className={`p-0 text-center text-xs border-l border-slate-100 cursor-pointer transition-colors ${baseBg} ${hasValue ? activeBg : ''}`}
                    onClick={() => onCellClick(company.id, activity.id)}
                    title={`Click to add contribution: ${company.name} → ${activity.title}`}
                  >
                    <div className="w-full h-full min-h-[44px] flex items-center justify-center relative">
                      {hasValue ? (
                        <span className={`font-black text-sm ${textColor}`}>
                          {valueMode === 'amount' && activity.unit_label?.includes('₹') ? '₹ ' : ''}
                          {valueMode === 'amount' ? value.toLocaleString() : value}
                        </span>
                      ) : (
                        <div className="opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all duration-200">
                          <div className="w-6 h-6 rounded-md bg-slate-200/50 flex items-center justify-center text-slate-400">
                            <Plus className="w-3 h-3" />
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          );
        })}

        {companyData.length === 0 && (
          <tr>
            <td colSpan={allActivities.length + 1} className="p-12 text-center text-slate-500 bg-slate-50">
              No companies found for this period.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
