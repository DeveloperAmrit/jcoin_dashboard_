// J-Coins Platform — TypeScript Type Definitions
// Matches the Supabase schema exactly

// ============================================
// Company
// ============================================
export interface Company {
  id: string;
  name: string;
  contact_person: string;
  contact_email: string;
  term_of_contract: number; // in years
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
