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
INSERT INTO public.jcoin_rules (id, activity_name, points_awarded, annual_cap, validity_months)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Research Collaboration', 500, 2000, 12),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Student Internship', 100, 1000, 6),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Tech Park Event Sponsorship', 300, 900, 12)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert J-Coin Ledger Entries
INSERT INTO public.jcoin_ledger (company_id, activity_id, date, description, coins_earned, coins_used, status)
VALUES 
  ('00000000-0000-0000-0000-000000001234', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '2026-10-12', 'Q3 Research Collaboration Finalized', 500, 0, 'approved'),
  ('00000000-0000-0000-0000-000000001234', NULL, '2026-09-05', 'Facility Booking (Auditorium)', 0, 2000, 'approved'),
  ('00000000-0000-0000-0000-000000001234', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '2026-08-20', 'Summer Internship Program Completion', 1000, 0, 'approved'),
  ('00000000-0000-0000-0000-000000001234', NULL, '2026-01-15', 'Annual Base Allocation', 7000, 0, 'approved')
ON CONFLICT DO NOTHING;
