// TypeScript types matching /docs/rfr-network/schema.sql
// Keep in lockstep with the SQL schema — do not drift.

export type ChapterStatus = 'active' | 'pending' | 'archived';
export type GlobalRole = 'super_admin' | 'chapter_admin' | 'member' | 'visitor';
export type ChapterRole = 'chapter_admin' | 'member';
export type MembershipStatus = 'active' | 'pending' | 'suspended' | 'removed';
export type ReferralStatus =
  | 'submitted'
  | 'contacted'
  | 'meeting_set'
  | 'in_progress'
  | 'closed_won'
  | 'closed_lost'
  | 'declined';
export type MeetingStatus = 'scheduled' | 'completed' | 'cancelled';
export type AttendanceStatus = 'present' | 'absent' | 'excused' | 'substitute';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Chapter {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  country: string | null;
  zip_code: string | null;
  description: string | null;
  meeting_day: string | null;
  meeting_time: string | null;
  meeting_location: string | null;
  chapter_admin_id: string | null;
  status: ChapterStatus;
  max_members: number | null;
  member_count: number | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  company_name: string | null;
  business_category: string | null;
  website: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  global_role: GlobalRole;
  is_active: boolean;
  joined_at: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChapterMembership {
  id: string;
  chapter_id: string;
  profile_id: string;
  chapter_role: ChapterRole;
  status: MembershipStatus;
  joined_at: string;
}

export interface Referral {
  id: string;
  chapter_id: string;
  from_profile_id: string;
  to_profile_id: string;
  referred_name: string;
  referred_email: string | null;
  referred_phone: string | null;
  referred_company: string | null;
  service_needed: string | null;
  notes: string | null;
  estimated_value_cents: number | null;
  actual_value_cents: number | null;
  status: ReferralStatus;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  meeting_date: string;
  meeting_time: string;
  location: string | null;
  virtual_link: string | null;
  status: MeetingStatus;
  attendance_count: number;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  meeting_id: string;
  profile_id: string;
  status: AttendanceStatus;
  substitute_name: string | null;
  check_in_time: string | null;
  notes: string | null;
  recorded_at: string;
}

export interface Invitation {
  id: string;
  chapter_id: string | null;
  invited_by_profile_id: string | null;
  invitee_email: string;
  invitee_name: string | null;
  invitation_token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  accepted_by_profile_id: string | null;
  created_at: string;
}

export interface Testimonial {
  id: string;
  from_profile_id: string;
  to_profile_id: string;
  chapter_id: string | null;
  content: string;
  is_public: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  profile_id: string;
  type: string;
  title: string;
  body: string | null;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  submitted: 'Submitted',
  contacted: 'Contacted',
  meeting_set: 'Meeting set',
  in_progress: 'In progress',
  closed_won: 'Closed — won',
  closed_lost: 'Closed — lost',
  declined: 'Declined',
};
