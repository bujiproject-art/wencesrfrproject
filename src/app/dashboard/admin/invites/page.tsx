import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import InvitesConsole from './InvitesConsole';

export default async function InvitesPage() {
  const ctx = await requireUser();

  if (!ctx.isChapterAdmin) {
    redirect('/dashboard');
  }

  const admin = createServiceRoleClient();

  let chapters: Array<{ id: string; name: string; slug: string }> = [];
  if (ctx.isSuperAdmin) {
    const { data } = await admin.from('chapters').select('id, name, slug').order('name');
    chapters = data || [];
  } else {
    const adminMemberships = ctx.memberships.filter(
      (m) => m.chapter_role === 'chapter_admin' && m.status === 'active',
    );
    const chapterIds = adminMemberships.map((m) => m.chapter_id);
    const { data } = await admin
      .from('chapters')
      .select('id, name, slug')
      .in('id', chapterIds)
      .order('name');
    chapters = data || [];
  }

  const chapterIds = chapters.map((c) => c.id);
  const { data: invitations } = chapterIds.length
    ? await admin
        .from('invitations')
        .select('id, chapter_id, invitee_email, invitee_name, status, created_at, expires_at, accepted_at')
        .in('chapter_id', chapterIds)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] };

  return (
    <InvitesConsole
      chapters={chapters}
      invitations={invitations || []}
      isSuperAdmin={ctx.isSuperAdmin}
    />
  );
}
