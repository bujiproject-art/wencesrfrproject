import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Profile, ChapterMembership } from '@/lib/types';

export type CurrentContext = {
  userId: string;
  email: string;
  profile: Profile;
  memberships: (ChapterMembership & { chapter_name?: string; chapter_slug?: string })[];
  primaryChapterId: string | null;
  primaryMembership: ChapterMembership | null;
  isSuperAdmin: boolean;
  isChapterAdmin: boolean;
};

// Fetch the signed-in user's profile + chapter context. Redirects to /login if unauthenticated.
export async function requireUser(): Promise<CurrentContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Use service role to fetch the profile reliably (RLS allows self-read,
  // but service role is simpler and safer for a server-side helper).
  const admin = createServiceRoleClient();

  let { data: profile } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!profile && user.email) {
    // Some accounts may be created without user_id linked (e.g., seeded super_admin).
    // Try to adopt the profile by email.
    const { data: byEmail } = await admin
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();
    if (byEmail) {
      await admin
        .from('profiles')
        .update({ user_id: user.id })
        .eq('id', byEmail.id);
      profile = { ...byEmail, user_id: user.id };
    }
  }

  if (!profile) {
    // No profile row — auto-create a minimal one so the dashboard can render.
    const { data: created } = await admin
      .from('profiles')
      .insert({
        user_id: user.id,
        email: user.email!,
        global_role: 'member',
      })
      .select('*')
      .single();
    profile = created!;
  }

  const { data: memberships } = await admin
    .from('chapter_memberships')
    .select(
      'id, chapter_id, profile_id, chapter_role, status, joined_at, chapters:chapter_id (name, slug)',
    )
    .eq('profile_id', profile.id)
    .in('status', ['active', 'pending']);

  type Row = ChapterMembership & { chapters: { name: string; slug: string } | null };
  const rows = (memberships ?? []) as unknown as Row[];
  const normalized = rows.map((m) => ({
    id: m.id,
    chapter_id: m.chapter_id,
    profile_id: m.profile_id,
    chapter_role: m.chapter_role,
    status: m.status,
    joined_at: m.joined_at,
    chapter_name: m.chapters?.name,
    chapter_slug: m.chapters?.slug,
  }));

  const primaryMembership =
    normalized.find((m) => m.status === 'active') ??
    normalized[0] ??
    null;

  const isSuperAdmin = profile.global_role === 'super_admin';
  const isChapterAdmin =
    isSuperAdmin ||
    normalized.some((m) => m.status === 'active' && m.chapter_role === 'chapter_admin');

  return {
    userId: user.id,
    email: user.email!,
    profile,
    memberships: normalized,
    primaryChapterId: primaryMembership?.chapter_id ?? null,
    primaryMembership: primaryMembership
      ? {
          id: primaryMembership.id,
          chapter_id: primaryMembership.chapter_id,
          profile_id: primaryMembership.profile_id,
          chapter_role: primaryMembership.chapter_role,
          status: primaryMembership.status,
          joined_at: primaryMembership.joined_at,
        }
      : null,
    isSuperAdmin,
    isChapterAdmin,
  };
}
