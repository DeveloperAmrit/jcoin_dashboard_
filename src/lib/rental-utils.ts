// Rental Business Logic Utilities
// Computes monthly rents, security deposits, FY month grids, etc.

import type { Company, CompanyCategory } from './types';
import {
  CATEGORY_MONTHLY_RATE,
  CATEGORY_SECURITY,
  ANNUAL_RENT_INCREASE,
} from './types';

// ============================================
// Indian Financial Year helpers
// FY runs April (month 4) → March (month 3 of next year)
// ============================================

export interface FYMonth {
  year: number;   // calendar year
  month: number;  // 1-indexed (1=Jan … 12=Dec)
  label: string;  // e.g. "Apr 2025"
}

/** Returns the 12 FY months for a given FY start year (April fyStartYear → March fyStartYear+1) */
export function getFYMonths(fyStartYear: number): FYMonth[] {
  const months: FYMonth[] = [];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  for (let i = 0; i < 12; i++) {
    // April = month index 3, so offset starts at 3
    const monthIndex = (3 + i) % 12; // 0-indexed month
    const year = i < 9 ? fyStartYear : fyStartYear + 1; // Apr-Dec = fyStartYear, Jan-Mar = fyStartYear+1
    months.push({
      year,
      month: monthIndex + 1, // 1-indexed
      label: `${monthNames[monthIndex]} ${year}`,
    });
  }
  return months;
}

export function getCurrentFYStartYear(): number {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

// ============================================
// Rent Computation
// 10% annual increase each year from agreement_start_date
// ============================================

/**
 * Computes the monthly rent (₹) for a company in a given calendar month.
 * Applies 10% annual compound increase based on which contract year the month falls in.
 */
export function computeMonthlyRent(
  company: Company,
  year: number,
  month: number // 1-indexed
): number {
  if (company.mode_of_joining === 'online') return 0;

  const baseRate = CATEGORY_MONTHLY_RATE[company.category as CompanyCategory] ?? 60;
  const monthlyRentBase = company.area_occupied * baseRate;

  // Determine which contract year this month belongs to
  const startDate = new Date(company.agreement_start_date);
  const targetDate = new Date(year, month - 1, 1); // first of the target month
  const diffMs = targetDate.getTime() - startDate.getTime();
  const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  const contractYear = Math.max(0, Math.floor(diffYears)); // 0-indexed

  // Apply 10% compound increase per year
  const multiplier = Math.pow(1 + ANNUAL_RENT_INCREASE, contractYear);
  return Math.round(monthlyRentBase * multiplier);
}

/**
 * Computes the security deposit amount for a company.
 * S1/S2: 2 months of base rent (no increase applied to deposit)
 * L1: ₹3000 per sq. ft.
 */
export function computeSecurityDeposit(company: Company): {
  amount: number;
  isRefundable: boolean;
  description: string;
} {
  if (company.mode_of_joining === 'online') {
    return { amount: 0, isRefundable: true, description: 'N/A (Online)' };
  }

  const rule = CATEGORY_SECURITY[company.category as CompanyCategory];
  if (!rule) return { amount: 0, isRefundable: true, description: '—' };

  if (rule.type === 'months_rent') {
    const baseRate = CATEGORY_MONTHLY_RATE[company.category as CompanyCategory] ?? 60;
    const amount = company.area_occupied * baseRate * rule.months;
    return {
      amount,
      isRefundable: true,
      description: `${rule.months} months rent (refundable)`,
    };
  } else {
    const amount = company.area_occupied * rule.rate;
    return {
      amount,
      isRefundable: false,
      description: `₹${rule.rate.toLocaleString('en-IN')}/sq ft (non-refundable)`,
    };
  }
}

/** Format ₹ amounts in Indian locale */
export function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
