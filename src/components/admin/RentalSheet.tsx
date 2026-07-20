'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, ChevronDown, Check, IndianRupee, Shield, TrendingUp } from 'lucide-react';
import type { Company, RentalPayment, SecurityDeposit, RentalPaymentStatus } from '@/lib/types';
import {
  getFYMonths,
  getCurrentFYStartYear,
  computeMonthlyRent,
  computeMaintenanceCost,
  computeTotalMonthlyDue,
  computeSecurityDeposit,
  formatINR,
  type FYMonth,
} from '@/lib/rental-utils';
import { getPastFinancialYears } from '@/lib/jcoin-utils';
import { upsertRentalPayment, upsertSecurityDeposit } from '@/app/admin/rentals/actions';

// Renders children on document.body via a portal to avoid invalid HTML nesting inside <table>
function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
}

interface Props {
  companies: Company[];
  payments: RentalPayment[];
  deposits: SecurityDeposit[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const STATUS_STYLES: Record<RentalPaymentStatus | 'none', string> = {
  paid:    'bg-emerald-100 border-emerald-300 text-emerald-800',
  partial: 'bg-amber-100 border-amber-300 text-amber-800',
  missed:  'bg-red-100 border-red-300 text-red-700',
  pending: 'bg-slate-100 border-slate-200 text-slate-500',
  none:    'bg-white border-slate-200 text-slate-300 hover:bg-slate-50',
};

const STATUS_DOT: Record<RentalPaymentStatus | 'none', string> = {
  paid:    'bg-emerald-500',
  partial: 'bg-amber-500',
  missed:  'bg-red-500',
  pending: 'bg-slate-400',
  none:    'bg-transparent',
};

function statusLabel(status: RentalPaymentStatus | 'none'): string {
  return { paid: 'Paid', partial: 'Partial', missed: 'Missed', pending: 'Pending', none: '—' }[status];
}

// ─────────────────────────────────────────────
// Payment Cell Modal
// ─────────────────────────────────────────────
function PaymentCellModal({
  company,
  fyMonth,
  existing,
  totalDue,
  onClose,
}: {
  company: Company;
  fyMonth: FYMonth;
  existing: RentalPayment | null;
  totalDue: number;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<RentalPaymentStatus>(existing?.status ?? 'paid');
  const [amountPaid, setAmountPaid] = useState<string>(
    existing ? String(existing.amount_paid) : String(totalDue)
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Auto-set amount when status changes
  useEffect(() => {
    if (status === 'paid') setAmountPaid(String(totalDue));
    else if (status === 'missed') setAmountPaid('0');
  }, [status, totalDue]);

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      await upsertRentalPayment({
        company_id: company.id,
        year: fyMonth.year,
        month: fyMonth.month,
        amount_paid: parseFloat(amountPaid) || 0,
        total_due: totalDue,
        status,
        notes: notes || null,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const monthName = fyMonth.label;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{company.name}</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">{monthName} — Rent</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl mt-0.5">✕</button>
          </div>
          <div className="mt-3 flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
            <IndianRupee className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Due: <span className="font-bold text-slate-800">{formatINR(totalDue)}</span></span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          {/* Status selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Payment Status</label>
            <div className="grid grid-cols-2 gap-2">
              {(['paid', 'partial', 'missed', 'pending'] as RentalPaymentStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-semibold capitalize transition-all ${
                    status === s
                      ? s === 'paid' ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : s === 'partial' ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : s === 'missed' ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-slate-400 bg-slate-50 text-slate-700'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
                  {statusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          {/* Amount paid */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount Paid (₹)</label>
            <input
              type="number"
              min={0}
              step="any"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              disabled={status === 'missed'}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-slate-50 disabled:text-slate-400"
            />
            {status === 'partial' && parseFloat(amountPaid) > 0 && (
              <p className="text-xs text-amber-600 mt-1">
                {formatINR(parseFloat(amountPaid))} of {formatINR(totalDue)} paid
                ({Math.round((parseFloat(amountPaid) / totalDue) * 100)}%)
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Cheque no. 1234"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-70 shadow-sm"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Security Deposit Modal
// ─────────────────────────────────────────────
function SecurityDepositModal({
  company,
  existing,
  totalDue,
  isRefundable,
  onClose,
}: {
  company: Company;
  existing: SecurityDeposit | null;
  totalDue: number;
  isRefundable: boolean;
  onClose: () => void;
}) {
  const [amountPaid, setAmountPaid] = useState(existing ? String(existing.amount_paid) : String(totalDue));
  const [paidAt, setPaidAt] = useState(existing?.paid_at?.split('T')[0] ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const fd = new FormData();
      fd.set('company_id', company.id);
      fd.set('amount_paid', amountPaid);
      fd.set('total_due', String(totalDue));
      fd.set('paid_at', paidAt || '');
      fd.set('is_refundable', String(isRefundable));
      fd.set('notes', notes);
      await upsertSecurityDeposit(fd);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{company.name}</p>
              <h3 className="text-lg font-bold text-slate-800 mt-0.5">Security Deposit</h3>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <IndianRupee className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-600">Due: <span className="font-bold text-slate-800">{formatINR(totalDue)}</span></span>
            </div>
            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${isRefundable ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {isRefundable ? 'Refundable' : 'Non-refundable'}
            </span>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>}

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Amount Paid (₹)</label>
            <input
              type="number" min={0} step="any" value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Date Paid</label>
            <input
              type="date" value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes</label>
            <input
              type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. DD number, bank details"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancel</button>
          <button
            onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-70 shadow-sm"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Month Cell
// ─────────────────────────────────────────────
function MonthCell({
  company,
  fyMonth,
  payment,
  totalDue,
  isFuture,
  isBeforeContract,
}: {
  company: Company;
  fyMonth: FYMonth;
  payment: RentalPayment | undefined;
  totalDue: number;
  isFuture: boolean;
  isBeforeContract: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  if (isBeforeContract) {
    return (
      <td className="p-0 border-l border-slate-100 min-w-[110px]">
        <div className="h-14 flex items-center justify-center">
          <span className="text-[10px] text-slate-300 italic">—</span>
        </div>
      </td>
    );
  }

  const status: RentalPaymentStatus | 'none' = payment ? payment.status : 'none';
  const cellStyle = STATUS_STYLES[status];
  const isClickable = !isFuture || status !== 'none';

  return (
    <>
      <td className="p-1.5 border-l border-slate-100 min-w-[110px]">
        <button
          onClick={() => setModalOpen(true)}
          disabled={isFuture && status === 'none'}
          className={`w-full h-11 rounded-lg border text-[11px] font-semibold transition-all duration-150 ${cellStyle} ${
            isFuture && status === 'none'
              ? 'opacity-40 cursor-not-allowed'
              : 'hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
          }`}
          title={
            payment
              ? `${statusLabel(status)}: ${formatINR(payment.amount_paid)} of ${formatINR(totalDue)}${payment.notes ? ` — ${payment.notes}` : ''}`
              : isFuture ? 'Future month' : 'Click to record payment'
          }
        >
          {payment ? (
            <div className="flex flex-col items-center leading-tight px-1">
              {status === 'paid' ? (
                <>
                  <Check className="w-3 h-3 mb-0.5" />
                  <span className="text-[10px]">{formatINR(payment.amount_paid)}</span>
                </>
              ) : status === 'partial' ? (
                <>
                  <span className="font-black">{formatINR(payment.amount_paid)}</span>
                  <span className="text-[9px] opacity-70">of {formatINR(totalDue)}</span>
                </>
              ) : status === 'missed' ? (
                <>
                  <span className="text-red-600 font-black text-sm">✗</span>
                  <span className="text-[9px]">Missed</span>
                </>
              ) : (
                <span className="text-slate-400 text-[10px]">Pending</span>
              )}
            </div>
          ) : (
            <span className="text-slate-300">·</span>
          )}
        </button>
      </td>

      {modalOpen && (
        <Portal>
          <PaymentCellModal
            company={company}
            fyMonth={fyMonth}
            existing={payment ?? null}
            totalDue={totalDue}
            onClose={() => setModalOpen(false)}
          />
        </Portal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Security Deposit Cell
// ─────────────────────────────────────────────
function SecurityDepositCell({
  company,
  deposit,
  totalDue,
  isRefundable,
}: {
  company: Company;
  deposit: SecurityDeposit | undefined;
  totalDue: number;
  isRefundable: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const isPaid = deposit && deposit.amount_paid >= deposit.total_due;
  const isPartial = deposit && deposit.amount_paid > 0 && deposit.amount_paid < deposit.total_due;

  return (
    <>
      <td className="p-2 border-l border-slate-100 min-w-[140px]">
        <button
          onClick={() => setModalOpen(true)}
          className={`w-full rounded-xl border px-3 py-2 text-left transition-all hover:shadow-sm active:scale-[0.98] cursor-pointer ${
            isPaid
              ? 'bg-emerald-50 border-emerald-200'
              : isPartial
              ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-0.5">
            <Shield className={`w-3 h-3 ${isPaid ? 'text-emerald-500' : isPartial ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isPaid ? 'text-emerald-600' : isPartial ? 'text-amber-600' : 'text-slate-500'}`}>
              {isPaid ? 'Paid' : isPartial ? 'Partial' : 'Not Paid'}
            </span>
          </div>
          <div className={`text-xs font-bold ${isPaid ? 'text-emerald-800' : isPartial ? 'text-amber-800' : 'text-slate-600'}`}>
            {deposit ? formatINR(deposit.amount_paid) : formatINR(totalDue)}
          </div>
          {isPartial && (
            <div className="text-[9px] text-amber-600 mt-0.5">of {formatINR(totalDue)}</div>
          )}
          <div className={`text-[9px] mt-0.5 ${isRefundable ? 'text-emerald-600' : 'text-orange-500'}`}>
            {isRefundable ? '↩ Refundable' : '× Non-refundable'}
          </div>
        </button>
      </td>

      {modalOpen && (
        <Portal>
          <SecurityDepositModal
            company={company}
            existing={deposit ?? null}
            totalDue={totalDue}
            isRefundable={isRefundable}
            onClose={() => setModalOpen(false)}
          />
        </Portal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────
// Main RentalSheet
// ─────────────────────────────────────────────
export default function RentalSheet({ companies, payments, deposits }: Props) {
  const [isFyDropdownOpen, setIsFyDropdownOpen] = useState(false);
  const fyRef = useRef<HTMLDivElement>(null);

  // Only show offline companies (online have no rent)
  const offlineCompanies = companies.filter((c) => c.mode_of_joining === 'offline');

  const allFinancialYears = useMemo(() => getPastFinancialYears(5), []);
  const [selectedFyIndex, setSelectedFyIndex] = useState(0);
  const selectedFy = allFinancialYears[selectedFyIndex];
  const fyStartYear = selectedFy.startYear;

  const fyMonths = useMemo(() => getFYMonths(fyStartYear), [fyStartYear]);
  const now = new Date();

  // Build lookup maps
  const paymentMap = useMemo(() => {
    const map = new Map<string, RentalPayment>();
    for (const p of payments) {
      map.set(`${p.company_id}_${p.year}_${p.month}`, p);
    }
    return map;
  }, [payments]);

  const depositMap = useMemo(() => {
    const map = new Map<string, SecurityDeposit>();
    for (const d of deposits) {
      map.set(d.company_id, d);
    }
    return map;
  }, [deposits]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (fyRef.current && !fyRef.current.contains(event.target as Node)) {
        setIsFyDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Summary stats
  const summary = useMemo(() => {
    let totalExpected = 0;
    let totalCollected = 0;
    let totalMissed = 0;

    for (const company of offlineCompanies) {
      for (const m of fyMonths) {
        const contractStart = new Date(company.agreement_start_date);
        const contractEnd = new Date(company.agreement_end_date);
        const mDate = new Date(m.year, m.month - 1, 1);
        if (mDate < contractStart || mDate > contractEnd) continue;
        if (mDate > now) continue;

        const due = computeTotalMonthlyDue(company, m.year, m.month);
        totalExpected += due;
        const payment = paymentMap.get(`${company.id}_${m.year}_${m.month}`);
        if (payment) {
          totalCollected += payment.amount_paid;
          if (payment.status === 'missed') totalMissed += due;
        }
      }
    }

    return { totalExpected, totalCollected, totalMissed };
  }, [offlineCompanies, fyMonths, paymentMap, now]);

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* Toolbar */}
      <div className="relative z-10 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-3 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-sm">
            <IndianRupee className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800">Rental Payments</h2>
            <p className="text-xs text-slate-500">FY {selectedFy.label} · {offlineCompanies.length} companies</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Summary chips */}
          <div className="hidden sm:flex items-center gap-2">
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
              Collected: {formatINR(summary.totalCollected)}
            </span>
            <span className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold">
              Expected: {formatINR(summary.totalExpected)}
            </span>
            {summary.totalMissed > 0 && (
              <span className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
                Missed: {formatINR(summary.totalMissed)}
              </span>
            )}
          </div>

          {/* FY Selector */}
          <div className="relative" ref={fyRef}>
            <button
              onClick={() => setIsFyDropdownOpen(!isFyDropdownOpen)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Calendar className="w-4 h-4 text-blue-500" />
              FY {selectedFy.label}
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isFyDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isFyDropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
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
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Legend:</span>
        {[
          { status: 'paid' as const, label: 'Paid in full' },
          { status: 'partial' as const, label: 'Partial payment' },
          { status: 'missed' as const, label: 'Missed / Not paid' },
          { status: 'pending' as const, label: 'Pending' },
        ].map(({ status, label }) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[status]}`} />
            <span className="text-xs text-slate-500">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">10% annual increase applied</span>
        </div>
      </div>

      {/* Sheet Table */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                {/* Sticky S.No */}
                <th className="p-4 sticky left-0 bg-slate-50/95 backdrop-blur-md z-20 shadow-[1px_0_0_0_#e2e8f0] w-10">S.No</th>
                {/* Sticky Company */}
                <th className="p-4 sticky left-[56px] bg-slate-50/95 backdrop-blur-md z-20 shadow-[1px_0_0_0_#e2e8f0] min-w-[180px]">Company</th>
                {/* Term */}
                <th className="p-4 min-w-[150px]">
                  <div className="flex flex-col gap-0.5">
                    <span>Term</span>
                    <span className="text-[9px] font-medium text-slate-400 normal-case">Start – End</span>
                  </div>
                </th>
                {/* Security Deposit */}
                <th className="p-4 bg-indigo-50/50 text-indigo-700 min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    Security Deposit
                  </div>
                </th>
                {/* Monthly Rent */}
                <th className="p-4 bg-emerald-50/50 text-emerald-700 min-w-[140px]">
                  <div className="flex flex-col gap-0.5">
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      Monthly Rent
                    </span>
                    <span className="text-[9px] font-medium text-emerald-600/70 normal-case">as of Apr {fyStartYear}</span>
                  </div>
                </th>
                {/* Month columns */}
                {fyMonths.map((m) => {
                  const isCurrent = m.year === now.getFullYear() && m.month === now.getMonth() + 1;
                  return (
                    <th
                      key={`${m.year}-${m.month}`}
                      className={`p-3 text-center min-w-[110px] ${isCurrent ? 'bg-blue-50/80 text-blue-700' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span>{m.label}</span>
                        {isCurrent && <span className="text-[9px] font-bold text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded-full normal-case">Current</span>}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100/80 text-sm">
              {offlineCompanies.map((company, index) => {
                const deposit = depositMap.get(company.id);
                const secInfo = computeSecurityDeposit(company);

                return (
                  <tr key={company.id} className="group hover:bg-blue-50/20 transition-colors duration-200">
                    {/* S.No */}
                    <td className="p-4 text-slate-400 font-medium sticky left-0 bg-white group-hover:bg-blue-50/20 transition-colors z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      {index + 1}
                    </td>

                    {/* Company Name */}
                    <td className="p-4 sticky left-[56px] bg-white group-hover:bg-blue-50/20 transition-colors z-10 shadow-[1px_0_0_0_#e2e8f0]">
                      <div className="font-bold text-slate-800">{company.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${
                          company.category === 'S1' ? 'bg-sky-100 text-sky-700 border-sky-200'
                          : company.category === 'S2' ? 'bg-violet-100 text-violet-700 border-violet-200'
                          : 'bg-amber-100 text-amber-700 border-amber-200'
                        }`}>
                          {company.category}
                        </span>
                        <span className="text-xs text-slate-400">{company.area_occupied} sq ft</span>
                      </div>
                    </td>

                    {/* Term */}
                    <td className="p-4">
                      <div className="text-xs font-semibold text-slate-700">
                        {new Date(company.agreement_start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">to</div>
                      <div className="text-xs font-semibold text-slate-700">
                        {new Date(company.agreement_end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{company.term_of_contract} yr(s)</div>
                    </td>

                    {/* Security Deposit */}
                    <SecurityDepositCell
                      company={company}
                      deposit={deposit}
                      totalDue={secInfo.amount}
                      isRefundable={secInfo.isRefundable}
                    />

                    {/* Monthly Rent (as of April of selected FY) */}
                    {(() => {
                      const aprilRent = computeMonthlyRent(company, fyStartYear, 4);
                      const maintenance = computeMaintenanceCost(company);
                      const total = aprilRent + maintenance;
                      const contractStart = new Date(company.agreement_start_date);
                      const aprilDate = new Date(fyStartYear, 3, 1);
                      const contractEnd = new Date(company.agreement_end_date);
                      const notActive = aprilDate < contractStart || aprilDate > contractEnd;
                      return (
                        <td className="p-3 bg-emerald-50/20">
                          {notActive ? (
                            <span className="text-slate-300 text-xs">—</span>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              <span className="text-base font-black text-emerald-700">{formatINR(total)}</span>
                              <span className="text-[10px] text-emerald-600/70">/month total</span>
                              <div className="mt-1 space-y-0.5 border-t border-emerald-100 pt-1">
                                <div className="flex justify-between text-[10px] text-slate-500">
                                  <span>Rent</span>
                                  <span className="font-medium">{formatINR(aprilRent)}</span>
                                </div>
                                <div className="flex justify-between text-[10px] text-slate-500">
                                  <span>Maintenance</span>
                                  <span className="font-medium">{formatINR(maintenance)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })()}

                    {/* Month cells */}
                    {fyMonths.map((m) => {
                      const contractStart = new Date(company.agreement_start_date);
                      const contractEnd = new Date(company.agreement_end_date);
                      const mDate = new Date(m.year, m.month - 1, 1);
                      const isFuture = mDate > now;
                      const isBeforeContract = mDate < contractStart || mDate > contractEnd;

                      const totalDue = computeTotalMonthlyDue(company, m.year, m.month);
                      const payment = paymentMap.get(`${company.id}_${m.year}_${m.month}`);

                      return (
                        <MonthCell
                          key={`${m.year}-${m.month}`}
                          company={company}
                          fyMonth={m}
                          payment={payment}
                          totalDue={totalDue}
                          isFuture={isFuture}
                          isBeforeContract={isBeforeContract}
                        />
                      );
                    })}
                  </tr>
                );
              })}

              {offlineCompanies.length === 0 && (
                <tr>
                  <td colSpan={4 + 12} className="p-12 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <IndianRupee className="w-10 h-10 text-slate-200" />
                      <p className="font-medium">No offline companies found.</p>
                      <p className="text-sm">Online companies have no rental dues.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile summary bar */}
      <div className="sm:hidden grid grid-cols-3 gap-2">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Collected</p>
          <p className="text-sm font-black text-emerald-800 mt-0.5">{formatINR(summary.totalCollected)}</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expected</p>
          <p className="text-sm font-black text-slate-700 mt-0.5">{formatINR(summary.totalExpected)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
          <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Missed</p>
          <p className="text-sm font-black text-red-700 mt-0.5">{formatINR(summary.totalMissed)}</p>
        </div>
      </div>
    </div>
  );
}
