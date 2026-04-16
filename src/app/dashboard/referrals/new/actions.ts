'use server';

import * as React from 'react';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { ReferralReceived } from '@/lib/email/templates/ReferralReceived';

export async function submitReferral(formData: FormData) {
  const ctx = await requireUser();
  if (!ctx.primaryChapterId) {
    return { error: 'You must belong to a chapter before submitting referrals.' };
  }

  const chapterId = String(formData.get('chapter_id') ?? ctx.primaryChapterId);
  const toProfileId = String(formData.get('to_profile_id') ?? '').trim();
  const referredName = String(formData.get('referred_name') ?? '').trim();

  if (!toProfileId || !referredName) {
    return { error: 'Recipient and prospect name are required.' };
  }
  if (toProfileId === ctx.profile.id) {
    return { error: 'You cannot refer a prospect to yourself.' };
  }

  const estimated = String(formData.get('estimated_value') ?? '').trim();
  const estimatedCents = estimated ? Math.round(Number(estimated) * 100) : null;

  const admin = createServiceRoleClient();

  // Verify recipient is in the same chapter (and active)
  const { data: recipientMembership } = await admin
    .from('chapter_memberships')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('profile_id', toProfileId)
    .eq('status', 'active')
    .maybeSingle();

  if (!recipientMembership) {
    return { error: 'Recipient is not an active member of your chapter.' };
  }

  const { error: insertError, data: inserted } = await admin
    .from('referrals')
    .insert({
      chapter_id: chapterId,
      from_profile_id: ctx.profile.id,
      to_profile_id: toProfileId,
      referred_name: referredName,
      referred_email: String(formData.get('referred_email') ?? '').trim() || null,
      referred_phone: String(formData.get('referred_phone') ?? '').trim() || null,
      referred_company: String(formData.get('referred_company') ?? '').trim() || null,
      service_needed: String(formData.get('service_needed') ?? '').trim() || null,
      notes: String(formData.get('notes') ?? '').trim() || null,
      estimated_value_cents: estimatedCents,
      status: 'submitted',
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    return { error: insertError?.message ?? 'Unable to save referral.' };
  }

  // Fire-and-forget in-app notification to the recipient
  await admin.from('notifications').insert({
    profile_id: toProfileId,
    type: 'referral_received',
    title: 'New referral received',
    body: `${ctx.profile.first_name ?? 'A member'} sent you a referral: ${referredName}`,
    link_url: '/dashboard/referrals',
  });

  // Fire-and-forget email to the recipient
  const { data: recipient } = await admin
    .from('profiles')
    .select('email, first_name')
    .eq('id', toProfileId)
    .single();

  if (recipient?.email) {
    const senderName = [ctx.profile.first_name, ctx.profile.last_name].filter(Boolean).join(' ') || 'A member';
    const referredCompany = String(formData.get('referred_company') ?? '').trim() || null;
    const serviceNeeded = String(formData.get('service_needed') ?? '').trim() || null;
    const notes = String(formData.get('notes') ?? '').trim() || null;
    const estimatedDisplay = estimatedCents ? `$${(estimatedCents / 100).toLocaleString()}` : null;

    await sendEmail({
      to: recipient.email,
      subject: `${senderName} sent you a referral: ${referredName}`,
      react: React.createElement(ReferralReceived, {
        recipientFirstName: recipient.first_name || 'there',
        senderName,
        prospectName: referredName,
        prospectCompany: referredCompany,
        serviceNeeded,
        estimatedValue: estimatedDisplay,
        notes,
      }),
    });
  }

  return { success: true, id: inserted.id };
}
