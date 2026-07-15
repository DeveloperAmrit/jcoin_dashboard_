-- J-Coins Management Platform - Seed Data
-- All 20 activities from Schedule C1 + sample companies + contributions

-- ============================================
-- 1. Seed Activities (12 Academic + 5 Non-Academic + 3 Sponsorship)
-- ============================================
INSERT INTO public.activities (id, serial_no, title, description, category, unit, unit_label, rate, is_system)
VALUES
  -- Academic Activities (12)
  ('a0000001-0000-0000-0000-000000000001', 1,
   'Sponsored Research Project with IIT Jodhpur or related entities',
   NULL, 'Academic', 'perTenLakhPaid', 'Per ₹10L paid', 100, true),

  ('a0000001-0000-0000-0000-000000000002', 2,
   'Consultancy with IIT Jodhpur or related entities',
   NULL, 'Academic', 'perTenLakhPaid', 'Per ₹10L paid', 100, true),

  ('a0000001-0000-0000-0000-000000000003', 3,
   'Joint R&D Project with IIT Jodhpur, IIT Jodhpur Centers of Excellence, or IIT Jodhpur Incubated Companies',
   NULL, 'Academic', 'perTenLakhPaid', 'Per ₹10L paid', 50, true),

  ('a0000001-0000-0000-0000-000000000004', 4,
   'Royalty payments to IIT Jodhpur or its entities',
   NULL, 'Academic', 'perLakhPaid', 'Per ₹1L paid', 100, true),

  ('a0000001-0000-0000-0000-000000000005', 5,
   'Engaging IIT Jodhpur Faculty as Advisors',
   NULL, 'Academic', 'perLakhPaid', 'Per ₹1L paid', 20, true),

  ('a0000001-0000-0000-0000-000000000006', 6,
   'Sponsoring employee as Adjunct or Chair Professor at IIT Jodhpur',
   NULL, 'Academic', 'perYear', 'Per year', 100, true),

  ('a0000001-0000-0000-0000-000000000007', 7,
   'Sponsoring employee for Ph.D. at IIT Jodhpur',
   NULL, 'Academic', 'perYear', 'Per year', 50, true),

  ('a0000001-0000-0000-0000-000000000008', 8,
   'Sponsoring employee for M.S./MTech/MBA at IIT Jodhpur',
   NULL, 'Academic', 'perYear', 'Per year', 25, true),

  ('a0000001-0000-0000-0000-000000000009', 9,
   'Client engaged in teaching activities at IIT Jodhpur',
   NULL, 'Academic', 'perHour', 'Per hour', 2, true),

  ('a0000001-0000-0000-0000-000000000010', 10,
   'Joint Ph.D. Guidance at IIT Jodhpur',
   NULL, 'Academic', 'annually', 'Annually', 50, true),

  ('a0000001-0000-0000-0000-000000000011', 12,
   'Joint M.S./MTech Guidance at IIT Jodhpur',
   NULL, 'Academic', 'annually', 'Annually', 25, true),

  ('a0000001-0000-0000-0000-000000000012', 13,
   'Joint B. Tech/M.Sc. Guidance at IIT Jodhpur',
   NULL, 'Academic', 'annually', 'Annually', 20, true),

  -- Non-Academic Activities (5)
  ('a0000002-0000-0000-0000-000000000001', 1,
   'Full-time employment for IIT Jodhpur graduates',
   NULL, 'Non-Academic', 'perGraduateHired', 'Per graduate hired', 50, true),

  ('a0000002-0000-0000-0000-000000000002', 2,
   'Part-time employment or internships for UG/PG students',
   NULL, 'Non-Academic', 'perStudentPerMonth', 'Per student per month', 2.5, true),

  ('a0000002-0000-0000-0000-000000000003', 3,
   'Part-time employment or internships for M.S./Ph.D. students',
   NULL, 'Non-Academic', 'perStudentPerMonth', 'Per student per month', 5, true),

  ('a0000002-0000-0000-0000-000000000004', 4,
   'Continuing education or training conducted by IIT Jodhpur faculty or entities',
   NULL, 'Non-Academic', 'perFiveThousandPaid', 'Per ₹5,000 paid', 1, true),

  ('a0000002-0000-0000-0000-000000000005', 5,
   'Faculty delivering lectures to employees',
   NULL, 'Non-Academic', 'perFiveThousandPaid', 'Per ₹5,000 paid', 1, true),

  -- Sponsorship Activities (3)
  ('a0000003-0000-0000-0000-000000000001', 6,
   'Sponsoring technical events at IIT Jodhpur (national/international)',
   NULL, 'Sponsorship', 'perTenThousandPaid', 'Per ₹10,000 paid', 1, true),

  ('a0000003-0000-0000-0000-000000000002', 7,
   'Sponsoring student events at IIT Jodhpur',
   NULL, 'Sponsorship', 'perTenThousandPaid', 'Per ₹10,000 paid', 0.5, true),

  ('a0000003-0000-0000-0000-000000000003', 8,
   'Grants (including CSR) made to IIT Jodhpur or its entities',
   NULL, 'Sponsorship', 'perTenThousandPaid', 'Per ₹10,000 paid', 1, true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  category = EXCLUDED.category,
  unit = EXCLUDED.unit,
  unit_label = EXCLUDED.unit_label,
  rate = EXCLUDED.rate;

-- ============================================
-- 2. Seed Companies (from spreadsheet images)
-- ============================================
INSERT INTO public.companies (id, name, contact_person, contact_email, term_of_contract, agreement_start_date, agreement_end_date, room_allocated, area_occupied, mode_of_joining)
VALUES
  ('c0000001-0000-0000-0000-000000000001',
   'Mashscape', 'Contact Person', 'contact@mashscape.com',
   1, '2022-01-01', '2023-01-01', NULL, 125, 'offline'),

  ('c0000001-0000-0000-0000-000000000002',
   'RSA', 'Contact Person', 'contact@rsa.com',
   1, '2024-01-01', '2025-01-01', NULL, 150, 'offline'),

  ('c0000001-0000-0000-0000-000000000003',
   'Saanji AI/ML/Life Pvt. Ltd.', 'Contact Person', 'contact@saanji.com',
   1, '2022-01-01', '2023-01-01', NULL, 275, 'offline'),

  ('c0000001-0000-0000-0000-000000000004',
   'Luit Renewable', 'Contact Person', 'contact@luitrenewable.com',
   1, '2024-01-01', '2025-01-01', NULL, 200, 'offline')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. Seed Sample Contributions (from spreadsheet images)
-- Saanji: Consultancy ₹2,00,000 (2 lakhs) = 200000/100000 * 100 = 20 JC
-- Luit: Consultancy ₹3,00,000 (3 lakhs) = 300000/100000 * 100 = 30 JC (but wait, the rate is per 10L)
-- Actually: ₹200000 = 2 lakhs. Rate is per ₹10L paid = 100 JC. So amount = 0.2 (in units of 10L), JC = 0.2 * 100 = 20
-- From spreadsheet: Saanji earned 20 academic JC, Luit not clear
-- Let me match the spreadsheet: Saanji target=55, earned academic=20
-- Luit target=40, earned academic=15 (not from spreadsheet directly but inferred)
-- ============================================
INSERT INTO public.contributions (id, company_id, activity_id, amount, jcoins_earned, date, notes, term_year)
VALUES
  -- Saanji: Consultancy with IIT Jodhpur - ₹200000 (shown in spreadsheet Image 4)
  ('d0000001-0000-0000-0000-000000000001',
   'c0000001-0000-0000-0000-000000000003',
   'a0000001-0000-0000-0000-000000000002',
   2, 20,
   '2022-06-15', 'Consultancy project - ₹2,00,000', 1),

  -- Luit: Consultancy with IIT Jodhpur - ₹300000 (shown in spreadsheet Image 4)
  ('d0000001-0000-0000-0000-000000000002',
   'c0000001-0000-0000-0000-000000000004',
   'a0000001-0000-0000-0000-000000000002',
   3, 30,
   '2024-06-15', 'Consultancy project - ₹3,00,000', 1)
ON CONFLICT (id) DO NOTHING;
