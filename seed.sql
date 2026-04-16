-- ============================================================
-- RFR Network Platform — Initial Seed Data
-- ============================================================
-- Run AFTER schema.sql on a fresh Supabase project.
-- Safe to run multiple times (all inserts use ON CONFLICT).
--
-- Usage:
--   psql "$DATABASE_URL" -f docs/rfr-network/seed.sql
-- ============================================================

BEGIN;

-- Super Admin: Wences
INSERT INTO profiles (email, first_name, last_name, company_name, city, state, global_role)
VALUES ('wencesn.2020@gmail.com', 'Wences', 'Navarro', 'RFR Network', 'Miami', 'FL', 'super_admin')
ON CONFLICT (email) DO UPDATE SET global_role = 'super_admin';

-- 10 Chapters across major US metros
INSERT INTO chapters (name, slug, city, state, description, meeting_day, meeting_time, meeting_location, max_members)
VALUES
  ('RFR Network - Miami Alpha',   'miami-alpha',   'Miami',       'FL', 'Founding chapter of RFR Network', 'Tuesday',   '07:30', 'TBD', 50),
  ('RFR Network - Miami Bravo',   'miami-bravo',   'Miami',       'FL', 'Second Miami chapter',            'Thursday',  '07:30', 'TBD', 50),
  ('RFR Network - Houston',       'houston',       'Houston',     'TX', 'Texas flagship chapter',          'Wednesday', '07:30', 'TBD', 50),
  ('RFR Network - Dallas',        'dallas',        'Dallas',      'TX', 'North Texas chapter',             'Tuesday',   '07:30', 'TBD', 50),
  ('RFR Network - Austin',        'austin',        'Austin',      'TX', 'Central Texas chapter',           'Thursday',  '07:30', 'TBD', 50),
  ('RFR Network - Atlanta',       'atlanta',       'Atlanta',     'GA', 'Georgia flagship chapter',        'Wednesday', '07:30', 'TBD', 50),
  ('RFR Network - Chicago',       'chicago',       'Chicago',     'IL', 'Midwest flagship chapter',        'Friday',    '07:30', 'TBD', 50),
  ('RFR Network - Phoenix',       'phoenix',       'Phoenix',     'AZ', 'Southwest flagship chapter',      'Tuesday',   '07:00', 'TBD', 50),
  ('RFR Network - Los Angeles',   'los-angeles',   'Los Angeles', 'CA', 'California flagship chapter',     'Thursday',  '07:00', 'TBD', 50),
  ('RFR Network - New York',      'new-york',      'New York',    'NY', 'East Coast flagship chapter',     'Wednesday', '07:30', 'TBD', 50)
ON CONFLICT (slug) DO NOTHING;

-- Make Wences chapter_admin of all chapters
DO $$
DECLARE
  wences_id UUID;
  ch RECORD;
BEGIN
  SELECT id INTO wences_id FROM profiles WHERE email = 'wencesn.2020@gmail.com';
  IF wences_id IS NULL THEN RETURN; END IF;

  FOR ch IN SELECT id FROM chapters LOOP
    INSERT INTO chapter_memberships (chapter_id, profile_id, chapter_role, status)
    VALUES (ch.id, wences_id, 'chapter_admin', 'active')
    ON CONFLICT (chapter_id, profile_id) DO UPDATE
      SET chapter_role = 'chapter_admin', status = 'active';

    UPDATE chapters SET chapter_admin_id = wences_id WHERE id = ch.id;
  END LOOP;
END $$;

COMMIT;
