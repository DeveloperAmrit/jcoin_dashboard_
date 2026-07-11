-- J-Coins Management Platform - Mock Data Seed Script

-- 1. Insert Companies
INSERT INTO public.companies (id, name, contact_person, contact_email, registered_address, agreement_start_date, agreement_end_date, min_annual_jcoin_target)
VALUES 
  ('00000000-0000-0000-0000-000000001234', 'Acme Corp', 'Alice Johnson', 'alice@acme.com', '123 Tech Park', '2023-01-01', '2028-12-31', 10000),
  ('11111111-1111-1111-1111-111111111111', 'Globex Inc', 'Bob Smith', 'bob@globex.com', '456 Innovation Blvd', '2024-06-01', '2029-05-31', 5000),
  ('22222222-2222-2222-2222-222222222222', 'Initech', 'Peter Gibbons', 'peter@initech.com', '789 Corporate Way', '2022-03-15', '2027-03-14', 15000)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert MoU Documents
INSERT INTO public.mou_documents (company_id, status, notes)
VALUES 
  ('00000000-0000-0000-0000-000000001234', 'approved', 'Standard MoU for Acme Corp'),
  ('11111111-1111-1111-1111-111111111111', 'under_review', 'Awaiting legal signoff'),
  ('22222222-2222-2222-2222-222222222222', 'clarification_needed', 'Need updated insurance docs')
ON CONFLICT DO NOTHING;

-- 3. Insert J-Coin Rules
INSERT INTO public.jcoin_rules (id, activity_name, category, unit_of_measurement, points_awarded, cap_rule, annual_cap, validity_months)
VALUES 
  -- Academic/R&D Activities
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sponsored Research Project with IIT Jodhpur or related entities', 'Academic/R&D', 'Per ₹10L paid', 100, NULL, NULL, 12),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Consultancy with IIT Jodhpur or related entities', 'Academic/R&D', 'Per ₹10L paid', 100, NULL, NULL, 12),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Joint R&D Project with IIT Jodhpur, IIT Jodhpur Centers of Excellence, or IIT Jodhpur Incubated Companies', 'Academic/R&D', 'Per ₹10L paid', 50, NULL, NULL, 12),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Royalty payments to IIT Jodhpur or its entities', 'Academic/R&D', 'Per ₹1L paid', 100, NULL, NULL, 12),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Engaging IIT Jodhpur Faculty as Advisors', 'Academic/R&D', 'Per ₹1L paid', 20, NULL, NULL, 12),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'Sponsoring employee as Adjunct or Chair Professor at IIT Jodhpur', 'Academic/R&D', 'Per year', 100, NULL, NULL, 12),
  ('11111111-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sponsoring employee for Ph.D. at IIT Jodhpur', 'Academic/R&D', 'Per year', 50, NULL, NULL, 12),
  ('22222222-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Sponsoring employee for M.S./MTech/MBA at IIT Jodhpur', 'Academic/R&D', 'Per year', 25, NULL, NULL, 12),
  ('33333333-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Client engaged in teaching activities at IIT Jodhpur', 'Academic/R&D', 'Per hour', 2, NULL, NULL, 12),
  ('44444444-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Joint Ph.D. Guidance at IIT Jodhpur', 'Academic/R&D', 'Annually', 50, NULL, NULL, 12),
  ('55555555-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Joint M.S./MTech Guidance at IIT Jodhpur', 'Academic/R&D', 'Annually', 25, NULL, NULL, 12),
  ('66666666-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Joint B. Tech/M.Sc. Guidance at IIT Jodhpur', 'Academic/R&D', 'Annually', 20, NULL, NULL, 12),
  
  -- Non-Academic Activities
  ('77777777-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Full-time employment for IIT Jodhpur graduates', 'Non-Academic', 'Per graduate hired', 50, 'Capped at 50% of the annual J-Coins obligation.', NULL, 12),
  ('88888888-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Part-time employment or internships for UG/PG students', 'Non-Academic', 'Per student per month', 2.5, 'Capped at 50% of the annual J-Coins obligation.', NULL, 12),
  ('99999999-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Part-time employment or internships for M.S./Ph.D. students', 'Non-Academic', 'Per student per month', 5, 'Capped at 50% of the annual J-Coins obligation.', NULL, 12),
  ('00000000-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Continuing education or training conducted by IIT Jodhpur faculty or entities', 'Non-Academic', 'Per ₹5,000 paid', 1, NULL, NULL, 12),
  ('11111111-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Faculty delivering lectures to employees', 'Non-Academic', 'Per ₹5,000 paid', 1, NULL, NULL, 12),
  ('22222222-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sponsoring technical events at IIT Jodhpur (national/international)', 'Non-Academic', 'Per ₹10,000 paid', 1, 'Capped at 10% of the annual J-Coins obligation.', NULL, 12),
  ('33333333-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sponsoring student events at IIT Jodhpur', 'Non-Academic', 'Per ₹10,000 paid', 0.5, 'Capped at 10% of the annual J-Coins obligation.', NULL, 12),
  ('44444444-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Grants (including CSR) made to IIT Jodhpur or its entities', 'Non-Academic', 'Per ₹10,000 paid', 1, NULL, NULL, 12)
ON CONFLICT (id) DO UPDATE SET 
  activity_name = EXCLUDED.activity_name,
  category = EXCLUDED.category,
  unit_of_measurement = EXCLUDED.unit_of_measurement,
  points_awarded = EXCLUDED.points_awarded,
  cap_rule = EXCLUDED.cap_rule;

-- 4. Insert J-Coin Ledger Entries
INSERT INTO public.jcoin_ledger (company_id, activity_id, date, description, coins_earned, coins_used, status)
VALUES 
  ('00000000-0000-0000-0000-000000001234', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-10-12', 'Q3 Research Collaboration Finalized', 500, 0, 'approved'),
  ('00000000-0000-0000-0000-000000001234', NULL, '2026-09-05', 'Facility Booking (Auditorium)', 0, 2000, 'approved'),
  ('00000000-0000-0000-0000-000000001234', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-08-20', 'Summer Internship Program Completion', 1000, 0, 'approved'),
  ('00000000-0000-0000-0000-000000001234', NULL, '2026-01-15', 'Annual Base Allocation', 7000, 0, 'approved')
ON CONFLICT DO NOTHING;
