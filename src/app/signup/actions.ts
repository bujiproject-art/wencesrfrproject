'use server';

import { redirect } from 'next/navigation';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function signupAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');
  const firstName = String(formData.get('first_name') ?? '').trim();
  const lastName = String(formData.get('last_name') ?? '').trim();
  const company = String(formData.get('company_name') ?? '').trim() || null;
  const city = String(formData.get('city') ?? '').trim() || null;
  const state = String(formData.get('state') ?? '').trim() || null;
  const chapterSlug = String(formData.get('chapter_slug') ?? '').trim() || null;
  const inviteToken = String(formData.get('invite_token') ?? '').trim() || null;

  if (!email || !password || !firstName || !lastName) {
    return { error: 'Email, password, and name are required.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }

  const supabase = await createClient();
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName },
    },
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  // Service role creates the profile row (avoids RLS friction at sign-up).
  const admin = createServiceRoleClient();
  const authUserId = signUpData.user?.id ?? null;

  const { data: existing } = await admin
    .from('profiles')
    .select('id, user_id')
    .eq('email', email)
    .maybeSingle();

  let profileId: string;

  if (existing) {
    profileId = existing.id;
    if (!existing.user_id && authUserId) {
      await admin.from('profiles').update({ user_id: authUserId }).eq('id', existing.id);
    }
  } else {
    const { data: inserted, error: insertError } = await admin
      .from('profiles')
      .insert({
        user_id: authUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        company_name: company,
        city,
        state,
        global_role: 'member',
      })
      .select('id')
      .single();

    if (insertError || !inserted) {
      return { error: insertError?.message ?? 'Unable to create profile.' };
    }
    profileId = inserted.id;
  }

  // Optional — if they picked a chapter, create a pending membership request.
  if (chapterSlug) {
    const { data: chapter } = await admin
      .from('chapters')
      .select('id')
      .eq('slug', chapterSlug)
      .maybeSingle();
    if (chapter) {
      await admin
        .from('chapter_memberships')
        .insert({
          chapter_id: chapter.id,
          profile_id: profileId,
          chapter_role: 'member',
          status: 'pending',
        })
        .select();
    }
  }

  // If they came in via an invite, auto-redeem it (active membership, no approval needed)
  if (inviteToken) {
    const { data: invitation } = await admin
      .from('invitations')
      .select('id, chapter_id, status, expires_at')
      .eq('invitation_token', inviteToken)
      .maybeSingle();

    if (
      invitation &&
      invitation.status === 'pending' &&
      (!invitation.expires_at || new Date(invitation.expires_at) > new Date())
    ) {
      const { data: existing } = await admin
        .from('chapter_memberships')
        .select('id')
        .eq('chapter_id', invitation.chapter_id)
        .eq('profile_id', profileId)
        .maybeSingle();

      if (existing) {
        await admin.from('chapter_memberships').update({ status: 'active' }).eq('id', existing.id);
      } else {
        await admin.from('chapter_memberships').insert({
          chapter_id: invitation.chapter_id,
          profile_id: profileId,
          chapter_role: 'member',
          status: 'active',
        });
      }

      await admin
        .from('invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
          accepted_by_profile_id: profileId,
        })
        .eq('id', invitation.id);
    }
  }

  // If email confirmation is OFF, the user is signed in. If it's ON, session may be null.
  if (signUpData.session) {
    redirect('/dashboard');
  }

  redirect('/login?next=/dashboard');
}
