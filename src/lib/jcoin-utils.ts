// J-Coins Platform — Business Logic Utilities
// Pure functions for target computation, term year handling, cap checking

import type {
  Company,
  Activity,
  Contribution,
  CategoryEarnings,
  CapStatus,
  ActivityCategory,
} from './types';

// ============================================
// Target Computation
// Per documentation:
//   Offline → 1 JC per 5 sq ft = area_occupied / 5
//   Online  → Fixed 100 JC
// ============================================
export function computeTarget(company: Company): number {
  if (company.mode_of_joining === 'online') {
    return 100;
  }
  return Math.ceil(company.area_occupied / 5);
}

// ============================================
// Term Year Calculation
// Term year is 1-indexed, based on agreement_start_date
// E.g., if start = 2022-01-01, then:
//   2022-01-01 to 2022-12-31 → term year 1
//   2023-01-01 to 2023-12-31 → term year 2
// ============================================
export function getCurrentTermYear(company: Company): number {
  const start = new Date(company.agreement_start_date);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  const termYear = Math.floor(diffYears) + 1;

  // Clamp to valid range
  return Math.max(1, Math.min(termYear, company.term_of_contract));
}

export function getTermYearDateRange(
  company: Company,
  termYear: number
): { start: Date; end: Date } {
  const startDate = new Date(company.agreement_start_date);
  const termStart = new Date(startDate);
  termStart.setFullYear(termStart.getFullYear() + (termYear - 1));

  const termEnd = new Date(startDate);
  termEnd.setFullYear(termEnd.getFullYear() + termYear);
  termEnd.setDate(termEnd.getDate() - 1); // last day of term year

  return { start: termStart, end: termEnd };
}

// ============================================
// Financial Year (April – March)
// ============================================
export function getCurrentFinancialYear(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  return {
    start: new Date(year, 3, 1), // April 1
    end: new Date(year + 1, 2, 31), // March 31
    label: `${year}-${(year + 1).toString().slice(-2)}`,
  };
}

export function getFinancialYearForDate(date: Date): string {
  const year = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${year}-${(year + 1).toString().slice(-2)}`;
}

// Get the term year ending date within the current financial year
export function getTermYearEndingInFY(company: Company): Date | null {
  const fy = getCurrentFinancialYear();
  const start = new Date(company.agreement_start_date);

  // Find the term year anniversary that falls within the current FY
  for (let y = 1; y <= company.term_of_contract + 1; y++) {
    const anniversary = new Date(start);
    anniversary.setFullYear(start.getFullYear() + y);
    if (anniversary >= fy.start && anniversary <= fy.end) {
      return anniversary;
    }
  }
  return null;
}

// ============================================
// Determine which term year a date falls into
// ============================================
export function getTermYearForDate(company: Company, date: Date): number {
  const start = new Date(company.agreement_start_date);
  const diffMs = date.getTime() - start.getTime();
  const diffYears = diffMs / (365.25 * 24 * 60 * 60 * 1000);
  return Math.max(1, Math.floor(diffYears) + 1);
}

// ============================================
// Category Earnings Aggregation
// Groups contributions by their activity's category
// ============================================
export function computeCategoryEarnings(
  contributions: Contribution[],
  activities: Activity[]
): CategoryEarnings {
  const activityMap = new Map(activities.map((a) => [a.id, a]));

  const result: CategoryEarnings = {
    academic: 0,
    nonAcademic: 0,
    sponsorship: 0,
    total: 0,
  };

  for (const c of contributions) {
    const activity = activityMap.get(c.activity_id);
    if (!activity) continue;

    switch (activity.category) {
      case 'Academic':
        result.academic += c.jcoins_earned;
        break;
      case 'Non-Academic':
        result.nonAcademic += c.jcoins_earned;
        break;
      case 'Sponsorship':
        result.sponsorship += c.jcoins_earned;
        break;
    }
  }

  result.total = result.academic + result.nonAcademic + result.sponsorship;
  return result;
}

// ============================================
// Cap Checking
// Academic    → no cap
// Non-Academic → 50% of target
// Sponsorship  → 10% of target
// ============================================
export function checkCaps(
  earnings: CategoryEarnings,
  target: number
): CapStatus {
  const nonAcademicCap = target * 0.5;
  const sponsorshipCap = target * 0.1;

  return {
    target,
    academicEarned: earnings.academic,
    nonAcademicEarned: earnings.nonAcademic,
    nonAcademicCap,
    nonAcademicExceeded: earnings.nonAcademic > nonAcademicCap,
    sponsorshipEarned: earnings.sponsorship,
    sponsorshipCap,
    sponsorshipExceeded: earnings.sponsorship > sponsorshipCap,
    totalEarned: earnings.total,
    deficit: Math.max(0, target - earnings.total),
  };
}

// ============================================
// J-Coins Earned Computation
// ============================================
export function computeJCoinsEarned(amount: number, rate: number): number {
  return amount * rate;
}

// ============================================
// Category display helpers
// ============================================
export function getCategoryColor(category: ActivityCategory): string {
  switch (category) {
    case 'Academic':
      return 'blue';
    case 'Non-Academic':
      return 'emerald';
    case 'Sponsorship':
      return 'amber';
  }
}

export function getCategoryCapPercent(category: ActivityCategory): number | null {
  switch (category) {
    case 'Academic':
      return null; // no cap
    case 'Non-Academic':
      return 50;
    case 'Sponsorship':
      return 10;
  }
}

// ============================================
// Filter contributions for a specific term year
// ============================================
export function filterContributionsByTermYear(
  contributions: Contribution[],
  termYear: number
): Contribution[] {
  return contributions.filter((c) => c.term_year === termYear);
}

// ============================================
// Group contributions by activity
// Returns map of activityId → total amount & jcoins
// ============================================
export function groupContributionsByActivity(
  contributions: Contribution[]
): Map<string, { totalAmount: number; totalJCoins: number }> {
  const map = new Map<string, { totalAmount: number; totalJCoins: number }>();

  for (const c of contributions) {
    const existing = map.get(c.activity_id) || { totalAmount: 0, totalJCoins: 0 };
    existing.totalAmount += c.amount;
    existing.totalJCoins += c.jcoins_earned;
    map.set(c.activity_id, existing);
  }

  return map;
}
