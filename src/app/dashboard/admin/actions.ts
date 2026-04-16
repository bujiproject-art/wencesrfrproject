'use server';

import * as React from 'react';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { MeetingReminder } from '@/lib/email/templates/MeetingReminder';
import { MembershipApproved } from '@/lib/email/templates/MembershipApproved';

async function authorizeChapterAdmin(chapterId: string) {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  if (ctx.isSuperAdmin) return { ctx, admin };

  const { data } = await admin
    .from('chapter_memberships')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('profile_id', ctx.profile.id)
    .eq('chapter_role', 'chapter_admin')
    .eq('status', 'active')
    .maybeSingle();

  if (!data) {
    throw new Error('Not authorized for this chapter.');
  }
  return { ctx, admin };
}

export async function createMeeting(formData: FormData) {
  const chapterId = String(formData.get('chapter_id') ?? '').trim();
  const title = String(formData.get('title') ?? '').trim();
  const meetingDate = String(formData.get('meeting_date') ?? '').trim();
  const meetingTime = String(formData.get('meeting_time') ?? '').trim();
  const location = String(formData.get('location') ?? '').trim() || null;
  const virtualLink = String(formData.get('virtual_link') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;

  if (!chapterId || !title || !meetingDate || !meetingTime) {
    return { error: 'Chapter, title, date, and time are required.' };
  }

  const { admin } = await authorizeChapterAdmin(chapterId);

  const { data: meeting, error } = await admin.from('meetings').insert({
    chapter_id: chapterId,
    title,
    meeting_date: meetingDate,
    meeting_time: meetingTime,
    location,
    virtual_link: virtualLink,
    description,
    status: 'scheduled',
  }).select('id').single();

  if (error) return { error: error.message };

  // Notify all active members of the chapter (in-app notification + email)
  if (meeting) {
    // Fetch chapter name once for both the email and fallback display
    const { data: chapter } = await admin
      .from('chapters')
      .select('name')
      .eq('id', chapterId)
      .single();

    const { data: members } = await admin
      .from('chapter_memberships')
      .select('profile_id, profile:profile_id(email, first_name)')
      .eq('chapter_id', chapterId)
      .eq('status', 'active');

    type MemberRow = {
      profile_id: string;
      profile: { email: string; first_name: string | null } | null;
    };
    const rows = (members || []) as unknown as MemberRow[];

    // In-app notifications (C1)
    if (rows.length) {
      const payload = rows.map((m) => ({
        profile_id: m.profile_id,
        type: 'meeting_scheduled',
        title: `New meeting: ${title}`,
        body: `${new Date(meetingDate).toLocaleDateString()} at ${meetingTime}`,
        link_url: '/dashboard',
      }));
      await admin.from('notifications').insert(payload);
    }

    // Email reminders (C5) — sendEmail swallows errors so failures don't block the action
    await Promise.all(
      rows
        .filter((m) => m.profile?.email)
        .map((m) =>
          sendEmail({
            to: m.profile!.email,
            subject: `Upcoming meeting: ${title} on ${meetingDate}`,
            react: React.createElement(MeetingReminder, {
              recipientFirstName: m.profile!.first_name || 'there',
              chapterName: chapter?.name || 'your chapter',
              meetingTitle: title,
              meetingDate,
              meetingTime,
              location,
              virtualLink,
              description,
            }),
          }),
        ),
    );
  }

  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function recordAttendance(formData: FormData) {
  const chapterId = String(formData.get('chapter_id') ?? '').trim();
  const meetingId = String(formData.get('meeting_id') ?? '').trim();
  const profileId = String(formData.get('profile_id') ?? '').trim();
  const status = String(formData.get('status') ?? 'present').trim();
  const substituteName = String(formData.get('substitute_name') ?? '').trim() || null;

  if (!meetingId || !profileId) {
    return { error: 'Meeting and member are required.' };
  }

  const { admin } = await authorizeChapterAdmin(chapterId);

  const { error } = await admin
    .from('attendance')
    .upsert(
      {
        meeting_id: meetingId,
        profile_id: profileId,
        status,
        substitute_name: status === 'substitute' ? substituteName : null,
        check_in_time: status === 'present' ? new Date().toISOString() : null,
        recorded_at: new Date().toISOString(),
      },
      { onConflict: 'meeting_id,profile_id' },
    );

  if (error) return { error: error.message };
  revalidatePath('/dashboard/admin');
  return { success: true };
}

export async function approveMembership(formData: FormData) {
  const chapterId = String(formData.get('chapter_id') ?? '').trim();
  const membershipId = String(formData.get('membership_id') ?? '').trim();

  if (!membershipId) return { error: 'Membership required.' };
  const { admin } = await authorizeChapterAdmin(chapterId);

  const { data: updated, error } = await admin
    .from('chapter_memberships')
    .update({ status: 'active' })
    .eq('id', membershipId)
    .eq('chapter_id', chapterId)
    .select('profile_id, chapter_id, chapters:chapter_id (name, meeting_day, meeting_time)')
    .single();

  if (error) return { error: error.message };

  // Notify the approved member (in-app notification + welcome email)
  if (updated) {
    type UpdatedRow = {
      profile_id: string;
      chapter_id: string;
      chapters: { name: string; meeting_day: string | null; meeting_time: string | null } | null;
    };
    const row = updated as unknown as UpdatedRow;

    // In-app notification (C1)
    await admin.from('notifications').insert({
      profile_id: row.profile_id,
      type: 'membership_approved',
      title: 'Membership approved',
      body: `Welcome to ${row.chapters?.name ?? 'your chapter'}! You can now give and receive referrals.`,
      link_url: '/dashboard',
    });

    // Welcome email (C5)
    const { data: profile } = await admin
      .from('profiles')
      .select('email, first_name')
      .eq('id', row.profile_id)
      .single();

    if (profile?.email && row.chapters) {
      await sendEmail({
        to: profile.email,
        subject: `Welcome to ${row.chapters.name}`,
        react: React.createElement(MembershipApproved, {
          recipientFirstName: profile.first_name || 'there',
          chapterName: row.chapters.name,
          meetingDay: row.chapters.meeting_day,
          meetingTime: row.chapters.meeting_time,
        }),
      });
    }
  }

  revalidatePath('/dashboard/admin');
  return { success: true };
}
