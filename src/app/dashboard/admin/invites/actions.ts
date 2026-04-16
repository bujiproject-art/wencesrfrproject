'use server';

import * as React from 'react';
import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { ChapterInvite } from '@/lib/email/templates/ChapterInvite';

export async function createInvitation(formData: FormData) {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const chapterId = String(formData.get('chapter_id') ?? '').trim();
  const inviteeEmail = String(formData.get('invitee_email') ?? '').trim().toLowerCase();
  const inviteeName = String(formData.get('invitee_name') ?? '').trim() || null;

  if (!chapterId || !inviteeEmail) {
    return { error: 'Chapter and email are required.' };
  }
  if (!inviteeEmail.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  if (!ctx.isSuperAdmin) {
    const { data: membership } = await admin
      .from('chapter_memberships')
      .select('id')
      .eq('chapter_id', chapterId)
      .eq('profile_id', ctx.profile.id)
      .eq('chapter_role', 'chapter_admin')
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return { error: 'You are not authorized to invite members to this chapter.' };
    }
  }

  const { data: existingProfile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', inviteeEmail)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingMembership } = await admin
      .from('chapter_memberships')
      .select('id, status')
      .eq('chapter_id', chapterId)
      .eq('profile_id', existingProfile.id)
      .maybeSingle();

    if (existingMembership && existingMembership.status === 'active') {
      return { error: 'This person is already an active member of this chapter.' };
    }
  }

  const { data: invitation, error: insertError } = await admin
    .from('invitations')
    .insert({
      chapter_id: chapterId,
      invited_by_profile_id: ctx.profile.id,
      invitee_email: inviteeEmail,
      invitee_name: inviteeName,
      status: 'pending',
    })
    .select('id, invitation_token, expires_at')
    .single();

  if (insertError || !invitation) {
    return { error: insertError?.message ?? 'Failed to create invitation.' };
  }

  const { data: chapter } = await admin
    .from('chapters')
    .select('name')
    .eq('id', chapterId)
    .single();

  const inviterName = [ctx.profile.first_name, ctx.profile.last_name].filter(Boolean).join(' ') || 'A chapter admin';
  const chapterName = chapter?.name || 'your chapter';
  const expiresDisplay = invitation.expires_at
    ? new Date(invitation.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  await sendEmail({
    to: inviteeEmail,
    subject: `${inviterName} invited you to join ${chapterName} on RFR Network`,
    react: React.createElement(ChapterInvite, {
      recipientName: inviteeName,
      inviterName,
      chapterName,
      inviteToken: invitation.invitation_token,
      expiresAt: expiresDisplay,
    }),
  });

  revalidatePath('/dashboard/admin/invites');
  return { success: true, id: invitation.id, token: invitation.invitation_token };
}

export async function revokeInvitation(formData: FormData) {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const invitationId = String(formData.get('invitation_id') ?? '').trim();
  if (!invitationId) return { error: 'Invitation required.' };

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, chapter_id, status')
    .eq('id', invitationId)
    .single();

  if (!invitation) return { error: 'Invitation not found.' };
  if (invitation.status !== 'pending') return { error: 'Only pending invitations can be revoked.' };

  if (!ctx.isSuperAdmin) {
    const { data: membership } = await admin
      .from('chapter_memberships')
      .select('id')
      .eq('chapter_id', invitation.chapter_id)
      .eq('profile_id', ctx.profile.id)
      .eq('chapter_role', 'chapter_admin')
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return { error: 'Not authorized.' };
  }

  const { error } = await admin
    .from('invitations')
    .update({ status: 'revoked' })
    .eq('id', invitationId);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/admin/invites');
  return { success: true };
}

export async function redeemInvitation(token: string) {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const { data: invitation } = await admin
    .from('invitations')
    .select('id, chapter_id, invitee_email, status, expires_at')
    .eq('invitation_token', token)
    .maybeSingle();

  if (!invitation) return { error: 'Invalid invitation link.' };
  if (invitation.status === 'accepted') return { error: 'This invitation has already been redeemed.' };
  if (invitation.status === 'revoked') return { error: 'This invitation has been revoked.' };
  if (invitation.status === 'expired') return { error: 'This invitation has expired.' };

  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    await admin.from('invitations').update({ status: 'expired' }).eq('id', invitation.id);
    return { error: 'This invitation has expired.' };
  }

  const { data: existing } = await admin
    .from('chapter_memberships')
    .select('id, status')
    .eq('chapter_id', invitation.chapter_id)
    .eq('profile_id', ctx.profile.id)
    .maybeSingle();

  if (existing) {
    if (existing.status !== 'active') {
      await admin
        .from('chapter_memberships')
        .update({ status: 'active' })
        .eq('id', existing.id);
    }
  } else {
    const { error: insertError } = await admin.from('chapter_memberships').insert({
      chapter_id: invitation.chapter_id,
      profile_id: ctx.profile.id,
      chapter_role: 'member',
      status: 'active',
    });

    if (insertError) return { error: insertError.message };
  }

  await admin
    .from('invitations')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
      accepted_by_profile_id: ctx.profile.id,
    })
    .eq('id', invitation.id);

  return { success: true, chapter_id: invitation.chapter_id };
}
