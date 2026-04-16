-- ============================================================
-- RFR Network Platform — Database Schema
-- ============================================================
-- Target: PostgreSQL 15+ (Supabase today, portable to Azure Postgres later)
-- Use: Run this migration on a FRESH Supabase project (not the Agent Midas one)
-- Portability: All tables use standard Postgres. RLS policies at bottom are
--   Supabase-specific and can be stripped when moving to Azure.
-- ============================================================

BEGIN;

-- ── Extensions ──
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. CHAPTERS — Geographic chapter units
-- ============================================================
CREATE TABLE IF NOT EXISTS chapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT DEFAULT 'US',
  zip_code TEXT,
  description TEXT,
  meeting_day TEXT, -- e.g. 'Tuesday'
  meeting_time TIME,
  meeting_location TEXT,
  chapter_admin_id UUID, -- FK to profiles (nullable — can be set after chapter exists)
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'archived')),
  max_members INTEGER DEFAULT 50,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chapters_slug ON chapters(slug);
CREATE INDEX idx_chapters_city_state ON chapters(city, state);
CREATE INDEX idx_chapters_status ON chapters(status);

-- ============================================================
-- 2. PROFILES — Member profiles (linked to auth.users via user_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE, -- FK to auth.users (Supabase) — nullable for portability
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  company_name TEXT,
  business_category TEXT, -- one per chapter seat (BNI model)
  website TEXT,
  linkedin_url TEXT,
  city TEXT,
  state TEXT,
  global_role TEXT DEFAULT 'member' CHECK (global_role IN ('super_admin', 'chapter_admin', 'member', 'visitor')),
  is_active BOOLEAN DEFAULT true,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_global_role ON profiles(global_role);

-- ============================================================
-- 3. CHAPTER_MEMBERSHIPS — Which member belongs to which chapter
-- ============================================================
CREATE TABLE IF NOT EXISTS chapter_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_role TEXT DEFAULT 'member' CHECK (chapter_role IN ('chapter_admin', 'member')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'suspended', 'removed')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chapter_id, profile_id)
);

CREATE INDEX idx_chapter_memberships_chapter ON chapter_memberships(chapter_id);
CREATE INDEX idx_chapter_memberships_profile ON chapter_memberships(profile_id);
CREATE INDEX idx_chapter_memberships_status ON chapter_memberships(status);

-- Add the chapter_admin_id FK after profiles exists
ALTER TABLE chapters
  ADD CONSTRAINT fk_chapters_admin
  FOREIGN KEY (chapter_admin_id) REFERENCES profiles(id) ON DELETE SET NULL;

-- ============================================================
-- 4. REFERRALS — Core value of the platform
-- ============================================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id),
  from_profile_id UUID NOT NULL REFERENCES profiles(id), -- who GAVE the referral
  to_profile_id UUID NOT NULL REFERENCES profiles(id),   -- who RECEIVED the referral
  referred_name TEXT NOT NULL,          -- the prospect's name
  referred_email TEXT,
  referred_phone TEXT,
  referred_company TEXT,
  service_needed TEXT,
  notes TEXT,
  estimated_value_cents INTEGER,        -- potential deal size in cents
  actual_value_cents INTEGER,           -- realized deal size in cents
  status TEXT DEFAULT 'submitted' CHECK (status IN (
    'submitted',      -- just created
    'contacted',      -- recipient has reached out to prospect
    'meeting_set',    -- meeting scheduled
    'in_progress',    -- actively working the deal
    'closed_won',     -- deal closed successfully
    'closed_lost',    -- deal did not close
    'declined'        -- recipient declined the referral
  )),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referrals_chapter ON referrals(chapter_id);
CREATE INDEX idx_referrals_from ON referrals(from_profile_id);
CREATE INDEX idx_referrals_to ON referrals(to_profile_id);
CREATE INDEX idx_referrals_status ON referrals(status);
CREATE INDEX idx_referrals_created_at ON referrals(created_at DESC);

-- ============================================================
-- 5. MEETINGS — Chapter meetings
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME NOT NULL,
  location TEXT,
  virtual_link TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  attendance_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meetings_chapter ON meetings(chapter_id);
CREATE INDEX idx_meetings_date ON meetings(meeting_date DESC);

-- ============================================================
-- 6. ATTENDANCE — Who attended which meeting
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'absent', 'excused', 'substitute')),
  substitute_name TEXT, -- if status='substitute'
  check_in_time TIMESTAMPTZ,
  notes TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, profile_id)
);

CREATE INDEX idx_attendance_meeting ON attendance(meeting_id);
CREATE INDEX idx_attendance_profile ON attendance(profile_id);

-- ============================================================
-- 7. INVITATIONS — Invitation/CTA tracking for signups
-- ============================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id UUID REFERENCES chapters(id),
  invited_by_profile_id UUID REFERENCES profiles(id),
  invitee_email TEXT NOT NULL,
  invitee_name TEXT,
  invitation_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  accepted_at TIMESTAMPTZ,
  accepted_by_profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invitations_token ON invitations(invitation_token);
CREATE INDEX idx_invitations_email ON invitations(invitee_email);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ============================================================
-- 8. TESTIMONIALS — Member-to-member endorsements (future: public display)
-- ============================================================
CREATE TABLE IF NOT EXISTS testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_profile_id UUID NOT NULL REFERENCES profiles(id),
  to_profile_id UUID NOT NULL REFERENCES profiles(id),
  chapter_id UUID REFERENCES chapters(id),
  content TEXT NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_testimonials_to ON testimonials(to_profile_id);
CREATE INDEX idx_testimonials_public ON testimonials(is_public) WHERE is_public = true;

-- ============================================================
-- 9. NOTIFICATIONS — In-app notification feed
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'referral_received', 'meeting_reminder', 'member_joined', etc.
  title TEXT NOT NULL,
  body TEXT,
  link_url TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_profile ON notifications(profile_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

-- ============================================================
-- TRIGGERS — Keep counters and timestamps in sync
-- ============================================================

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chapters_updated BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_referrals_updated BEFORE UPDATE ON referrals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_meetings_updated BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Auto-maintain chapter.member_count
CREATE OR REPLACE FUNCTION update_chapter_member_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    UPDATE chapters SET member_count = member_count + 1 WHERE id = NEW.chapter_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'active' THEN
    UPDATE chapters SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.chapter_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status = 'active' AND NEW.status != 'active' THEN
      UPDATE chapters SET member_count = GREATEST(0, member_count - 1) WHERE id = NEW.chapter_id;
    ELSIF OLD.status != 'active' AND NEW.status = 'active' THEN
      UPDATE chapters SET member_count = member_count + 1 WHERE id = NEW.chapter_id;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chapter_memberships_count AFTER INSERT OR UPDATE OR DELETE ON chapter_memberships
  FOR EACH ROW EXECUTE FUNCTION update_chapter_member_count();

-- Auto-maintain meeting.attendance_count
CREATE OR REPLACE FUNCTION update_meeting_attendance_count() RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'present' THEN
    UPDATE meetings SET attendance_count = attendance_count + 1 WHERE id = NEW.meeting_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'present' THEN
    UPDATE meetings SET attendance_count = GREATEST(0, attendance_count - 1) WHERE id = OLD.meeting_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_attendance_count AFTER INSERT OR DELETE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_meeting_attendance_count();

-- ============================================================
-- ROW LEVEL SECURITY (Supabase-specific — strip for Azure)
-- ============================================================

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Chapters: public can read active chapters (for chapter finder)
CREATE POLICY "chapters_public_read" ON chapters
  FOR SELECT USING (status = 'active');

-- Chapters: super_admin or chapter_admin can modify
CREATE POLICY "chapters_admin_modify" ON chapters
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND global_role IN ('super_admin', 'chapter_admin'))
  );

-- Profiles: users can read their own profile + other members in their chapter
CREATE POLICY "profiles_self_read" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "profiles_chapter_member_read" ON profiles
  FOR SELECT USING (
    id IN (
      SELECT cm2.profile_id FROM chapter_memberships cm1
      JOIN chapter_memberships cm2 ON cm1.chapter_id = cm2.chapter_id
      JOIN profiles p ON p.id = cm1.profile_id
      WHERE p.user_id = auth.uid() AND cm1.status = 'active' AND cm2.status = 'active'
    )
  );

CREATE POLICY "profiles_self_update" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- Referrals: members can see referrals involving them or in their chapters
CREATE POLICY "referrals_involved_read" ON referrals
  FOR SELECT USING (
    from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR to_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR chapter_id IN (
      SELECT cm.chapter_id FROM chapter_memberships cm
      JOIN profiles p ON p.id = cm.profile_id
      WHERE p.user_id = auth.uid() AND cm.status = 'active'
    )
  );

CREATE POLICY "referrals_insert_own" ON referrals
  FOR INSERT WITH CHECK (
    from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "referrals_update_involved" ON referrals
  FOR UPDATE USING (
    from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR to_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Meetings: chapter members can read their chapter's meetings
CREATE POLICY "meetings_chapter_read" ON meetings
  FOR SELECT USING (
    chapter_id IN (
      SELECT cm.chapter_id FROM chapter_memberships cm
      JOIN profiles p ON p.id = cm.profile_id
      WHERE p.user_id = auth.uid() AND cm.status = 'active'
    )
  );

CREATE POLICY "meetings_admin_modify" ON meetings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM chapter_memberships cm
      JOIN profiles p ON p.id = cm.profile_id
      WHERE p.user_id = auth.uid()
        AND cm.chapter_id = meetings.chapter_id
        AND cm.chapter_role = 'chapter_admin'
        AND cm.status = 'active'
    )
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND global_role = 'super_admin')
  );

-- Attendance: members can see their own + chapter admins can see all
CREATE POLICY "attendance_self_read" ON attendance
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM meetings m
      JOIN chapter_memberships cm ON cm.chapter_id = m.chapter_id
      JOIN profiles p ON p.id = cm.profile_id
      WHERE m.id = attendance.meeting_id
        AND p.user_id = auth.uid()
        AND cm.chapter_role = 'chapter_admin'
    )
  );

-- Chapter memberships: members can see their own chapter's memberships
CREATE POLICY "memberships_chapter_read" ON chapter_memberships
  FOR SELECT USING (
    chapter_id IN (
      SELECT cm.chapter_id FROM chapter_memberships cm
      JOIN profiles p ON p.id = cm.profile_id
      WHERE p.user_id = auth.uid() AND cm.status = 'active'
    )
  );

-- Invitations: invited_by can see their own invitations
CREATE POLICY "invitations_self_read" ON invitations
  FOR SELECT USING (
    invited_by_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Testimonials: public ones visible to anyone, private only to giver/receiver
CREATE POLICY "testimonials_public_read" ON testimonials
  FOR SELECT USING (
    is_public = true
    OR from_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR to_profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Notifications: self only
CREATE POLICY "notifications_self_read" ON notifications
  FOR SELECT USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "notifications_self_update" ON notifications
  FOR UPDATE USING (
    profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Service role bypasses all RLS
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

COMMIT;

-- ============================================================
-- SEED DATA — remove this block for production deployment
-- ============================================================

-- Insert Wences (super admin) and a first chapter for testing
INSERT INTO profiles (email, first_name, last_name, company_name, city, state, global_role)
VALUES ('wencesn.2020@gmail.com', 'Wences', 'Navarro', 'RFR Network', 'Miami', 'FL', 'super_admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO chapters (name, slug, city, state, description, meeting_day, meeting_time)
VALUES
  ('RFR Network - Miami Alpha', 'miami-alpha', 'Miami', 'FL', 'Founding chapter of RFR Network', 'Tuesday', '07:30'),
  ('RFR Network - Houston', 'houston', 'Houston', 'TX', 'Texas flagship chapter', 'Wednesday', '07:30'),
  ('RFR Network - Los Angeles', 'los-angeles', 'Los Angeles', 'CA', 'California flagship chapter', 'Thursday', '07:00')
ON CONFLICT (slug) DO NOTHING;
