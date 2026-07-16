// J-Coins Platform — TypeScript Type Definitions
// Matches the Supabase schema exactly

// ============================================
// Company
// ============================================

/**
 * Rental category per Annexure C.
 * Determines the J-COINS required per 250 sq. ft. (the "rate"):
 *   S1 → 50 JC / 250 sq ft
 *   S2 → 100 JC / 250 sq ft
 *   L1 → 100 JC / 250 sq ft
 */
export type CompanyCategory = 'S1' | 'S2' | 'L1';

/** J-COINS required per 250 sq. ft. for each category */
export const CATEGORY_RATE: Record<CompanyCategory, number> = {
  S1: 50,
  S2: 100,
  L1: 100,
};

export interface Company {
  id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  category: CompanyCategory; // rental category (S1 | S2 | L1)
  associated_professors: string[]; // list of associated professor names
  term_of_contract: number; // in years (user-entered; term duration not derived from category)
  agreement_start_date: string; // ISO date string
  agreement_end_date: string; // ISO date string
  room_allocated: string | null;
  area_occupied: number; // in sq. ft.
  mode_of_joining: 'online' | 'offline';
  created_at: string;
}

// ============================================
// Activity
// ============================================
export type ActivityCategory = 'Academic' | 'Non-Academic' | 'Sponsorship';

export type ActivityUnit =
  | 'perTenLakhPaid'
  | 'perLakhPaid'
  | 'perYear'
  | 'perHour'
  | 'annually'
  | 'perGraduateHired'
  | 'perStudentPerMonth'
  | 'perFiveThousandPaid'
  | 'perTenThousandPaid';

export interface Activity {
  id: string;
  serial_no: number | null;
  title: string;
  description: string | null;
  category: ActivityCategory;
  unit: ActivityUnit;
  unit_label: string | null;
  rate: number; // J-Coins per unit
  is_system: boolean;
  created_at: string;
}

// ============================================
// Contribution (formerly "Earn object")
// ============================================
export interface Contribution {
  id: string;
  company_id: string;
  activity_id: string;
  amount: number; // quantity in the activity's unit
  jcoins_earned: number; // computed: amount × rate
  date: string; // ISO date string
  notes: string | null;
  term_year: number; // which contract year (1-indexed)
  created_at: string;
}

// ============================================
// Joined types for queries
// ============================================
export interface ContributionWithActivity extends Contribution {
  activities: Activity | null;
}

export interface ContributionWithCompanyAndActivity extends Contribution {
  companies: { name: string } | null;
  activities: { title: string; category: ActivityCategory } | null;
}

// ============================================
// Cap checking result
// ============================================
export interface CapStatus {
  target: number;
  academicEarned: number;
  nonAcademicEarned: number;
  nonAcademicCap: number;
  nonAcademicExceeded: boolean;
  sponsorshipEarned: number;
  sponsorshipCap: number;
  sponsorshipExceeded: boolean;
  totalEarned: number;
  deficit: number;
}

// ============================================
// Category earnings breakdown
// ============================================
export interface CategoryEarnings {
  academic: number;
  nonAcademic: number;
  sponsorship: number;
  total: number;
}

// ============================================
// Rental Structure (Annexure C)
// ============================================

/** Monthly fee in INR per sq. ft. per category */
export const CATEGORY_MONTHLY_RATE: Record<CompanyCategory, number> = {
  S1: 60,  // ₹60/sq ft/month
  S2: 50,  // ₹50/sq ft/month
  L1: 10,  // ₹10/sq ft/month
};

/** Security deposit rule per category */
export type SecurityRule =
  | { type: 'months_rent'; months: number; refundable: true }
  | { type: 'per_sqft'; rate: number; refundable: false };

export const CATEGORY_SECURITY: Record<CompanyCategory, SecurityRule> = {
  S1: { type: 'months_rent', months: 2, refundable: true },
  S2: { type: 'months_rent', months: 2, refundable: true },
  L1: { type: 'per_sqft', rate: 3000, refundable: false },
};

/** Annual rent increase rate (10% for all categories) */
export const ANNUAL_RENT_INCREASE = 0.10;

export type RentalPaymentStatus = 'paid' | 'partial' | 'missed' | 'pending';

/** One row in the rental_payments table */
export interface RentalPayment {
  id: string;
  company_id: string;
  year: number;          // calendar year of the month
  month: number;         // 1-indexed (1=Jan … 12=Dec)
  amount_paid: number;   // actual INR paid
  total_due: number;     // computed expected INR for that month
  status: RentalPaymentStatus;
  notes: string | null;
  created_at: string;
}

/** Security deposit record */
export interface SecurityDeposit {
  id: string;
  company_id: string;
  amount_paid: number;
  total_due: number;
  paid_at: string | null; // ISO date string, null = not yet paid
  is_refundable: boolean;
  notes: string | null;
  created_at: string;
}
