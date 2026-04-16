'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { ReferralStatus } from '@/lib/types';

const ALL_STATUSES: ReferralStatus[] = [
  'submitted',
  'contacted',
  'meeting_set',
  'in_progress',
  'closed_won',
  'closed_lost',
  'declined',
];

async function loadInvolvedReferral(referralId: string) {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();
  const { data: referral } = await admin
    .from('referrals')
    .select('id, from_profile_id, to_profile_id, chapter_id, status, referred_name')
    .eq('id', referralId)
    .maybeSingle();

  if (!referral) {
    return { error: 'Referral not found.' as const };
  }

  const isRecipient = referral.to_profile_id === ctx.profile.id;
  const isGiver = referral.from_profile_id === ctx.profile.id;

  if (!isRecipient && !isGiver) {
    return { error: 'Not authorized.' as const };
  }

  return { ctx, admin, referral, isRecipient, isGiver };
}

export async function updateReferralStatus(formData: FormData) {
  const referralId = String(formData.get('referral_id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim() as ReferralStatus;
  const actualValueRaw = String(formData.get('actual_value') ?? '').trim();

  if (!referralId || !status) {
    return { error: 'Missing referral or status.' };
  }
  if (!ALL_STATUSES.includes(status)) {
    return { error: 'Invalid status.' };
  }

  const loaded = await loadInvolvedReferral(referralId);
  if ('error' in loaded) return { error: loaded.error };
  const { admin, referral, isRecipient, ctx } = loaded;

  // Only the recipient can advance pipeline status (contacted → closed_won/lost).
  // The giver can mark 'declined' if recipient refuses, but for MVP we let either
  // party update to keep things simple. Log who changed it via notification.
  if (!isRecipient && (status === 'closed_won' || status === 'in_progress')) {
    return { error: 'Only the recipient can mark pipeline progress.' };
  }

  const patch: Record<string, unknown> = { status };

  if (status === 'closed_won') {
    const cents = actualValueRaw ? Math.round(Number(actualValueRaw) * 100) : null;
    if (!cents || Number.isNaN(cents) || cents <= 0) {
      return { error: 'Actual deal value is required when marking closed-won.' };
    }
    patch.actual_value_cents = cents;
    patch.closed_at = new Date().toISOString();
  } else if (status === 'closed_lost' || status === 'declined') {
    patch.closed_at = new Date().toISOString();
  } else {
    patch.closed_at = null;
  }

  const { error } = await admin.from('referrals').update(patch).eq('id', referralId);
  if (error) return { error: error.message };

  // Notify the other party that status changed.
  const otherPartyId = isRecipient ? referral.from_profile_id : referral.to_profile_id;
  await admin.from('notifications').insert({
    profile_id: otherPartyId,
    type: 'referral_status_changed',
    title: 'Referral status updated',
    body: `${ctx.profile.first_name ?? 'A member'} updated "${referral.referred_name}" to ${status.replace('_', ' ')}`,
    link_url: `/dashboard/referrals/${referralId}`,
  });

  revalidatePath(`/dashboard/referrals/${referralId}`);
  revalidatePath('/dashboard/referrals');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function updateReferralNotes(formData: FormData) {
  const referralId = String(formData.get('referral_id') ?? '').trim();
  const notes = String(formData.get('notes') ?? '');

  if (!referralId) {
    return { error: 'Missing referral.' };
  }

  const loaded = await loadInvolvedReferral(referralId);
  if ('error' in loaded) return { error: loaded.error };
  const { admin } = loaded;

  const { error } = await admin
    .from('referrals')
    .update({ notes: notes || null })
    .eq('id', referralId);

  if (error) return { error: error.message };
  revalidatePath(`/dashboard/referrals/${referralId}`);
  return { success: true };
}
