import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Meeting, Profile, ChapterMembership, Chapter } from '@/lib/types';
import AdminConsole from './AdminConsole';

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string }>;
}) {
  const ctx = await requireUser();
  if (!ctx.isChapterAdmin) {
    redirect('/dashboard');
  }

  const admin = createServiceRoleClient();

  // Determine which chapters this user can admin
  let chapters: Chapter[] = [];
  if (ctx.isSuperAdmin) {
    const { data } = await admin
      .from('chapters')
      .select('*')
      .order('state', { ascending: true })
      .order('city', { ascending: true });
    chapters = (data ?? []) as Chapter[];
  } else {
    const adminChapterIds = ctx.memberships
      .filter((m) => m.status === 'active' && m.chapter_role === 'chapter_admin')
      .map((m) => m.chapter_id);
    if (adminChapterIds.length) {
      const { data } = await admin
        .from('chapters')
        .select('*')
        .in('id', adminChapterIds);
      chapters = (data ?? []) as Chapter[];
    }
  }

  if (!chapters.length) {
    return (
      <div className="card">
        <h1 className="font-serif text-2xl font-bold text-white">Chapter admin</h1>
        <p className="mt-2 text-gray-300">
          You don't administer any chapters yet.
        </p>
      </div>
    );
  }

  const { chapter: chapterSlugParam } = await searchParams;
  const activeChapter =
    chapters.find((c) => c.slug === chapterSlugParam) ?? chapters[0];

  const [{ data: membershipsRaw }, { data: meetingsRaw }] = await Promise.all([
    admin
      .from('chapter_memberships')
      .select(
        'id, chapter_id, profile_id, chapter_role, status, joined_at, profiles:profile_id (id, first_name, last_name, email, company_name, business_category)',
      )
      .eq('chapter_id', activeChapter.id)
      .order('status', { ascending: true })
      .order('joined_at', { ascending: true }),
    admin
      .from('meetings')
      .select('*')
      .eq('chapter_id', activeChapter.id)
      .order('meeting_date', { ascending: false })
      .limit(10),
  ]);

  type MemRow = ChapterMembership & {
    profiles: Pick<
      Profile,
      'id' | 'first_name' | 'last_name' | 'email' | 'company_name' | 'business_category'
    > | null;
  };

  const memberships = (membershipsRaw ?? []) as unknown as MemRow[];
  const meetings = (meetingsRaw ?? []) as Meeting[];

  // Fetch attendance for the most recent meeting (if any) so admin can record quickly
  let attendanceByProfile: Record<string, string> = {};
  const mostRecentMeeting = meetings[0];
  if (mostRecentMeeting) {
    const { data: attRows } = await admin
      .from('attendance')
      .select('profile_id, status')
      .eq('meeting_id', mostRecentMeeting.id);
    (attRows ?? []).forEach((r: { profile_id: string; status: string }) => {
      attendanceByProfile[r.profile_id] = r.status;
    });
  }

  return (
    <AdminConsole
      chapters={chapters}
      activeChapter={activeChapter}
      memberships={memberships.map((m) => ({
        id: m.id,
        chapter_id: m.chapter_id,
        profile_id: m.profile_id,
        chapter_role: m.chapter_role,
        status: m.status,
        joined_at: m.joined_at,
        profile: m.profiles,
      }))}
      meetings={meetings}
      mostRecentMeetingId={mostRecentMeeting?.id ?? null}
      attendanceByProfile={attendanceByProfile}
    />
  );
}
