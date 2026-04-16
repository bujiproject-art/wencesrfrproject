'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

async function requireSuperAdmin() {
  const ctx = await requireUser();
  if (!ctx.isSuperAdmin) {
    throw new Error('Super-admin only.');
  }
  return { ctx, admin: createServiceRoleClient() };
}

function slugify(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function createChapter(formData: FormData) {
  const { ctx, admin } = await requireSuperAdmin();

  const name = String(formData.get('name') ?? '').trim();
  const slugInput = String(formData.get('slug') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const state = String(formData.get('state') ?? '').trim();
  const zipCode = String(formData.get('zip_code') ?? '').trim() || null;
  const description = String(formData.get('description') ?? '').trim() || null;
  const meetingDay = String(formData.get('meeting_day') ?? '').trim() || null;
  const meetingTime = String(formData.get('meeting_time') ?? '').trim() || null;
  const meetingLocation = String(formData.get('meeting_location') ?? '').trim() || null;
  const maxMembersRaw = String(formData.get('max_members') ?? '').trim();
  const maxMembers = maxMembersRaw ? Number(maxMembersRaw) : 50;

  if (!name || !city || !state) {
    return { error: 'Name, city, and state are required.' };
  }

  const slug = slugify(slugInput || name);
  if (!slug) {
    return { error: 'Unable to derive a slug.' };
  }

  const { data: existing } = await admin
    .from('chapters')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();
  if (existing) {
    return { error: `Slug "${slug}" is already taken.` };
  }

  const { data: chapter, error } = await admin
    .from('chapters')
    .insert({
      name,
      slug,
      city,
      state: state.toUpperCase(),
      zip_code: zipCode,
      description,
      meeting_day: meetingDay,
      meeting_time: meetingTime,
      meeting_location: meetingLocation,
      max_members: maxMembers || 50,
      status: 'active',
      chapter_admin_id: ctx.profile.id,
    })
    .select('id')
    .single();

  if (error || !chapter) {
    return { error: error?.message ?? 'Unable to create chapter.' };
  }

  // Add the super-admin as the chapter_admin member
  await admin.from('chapter_memberships').insert({
    chapter_id: chapter.id,
    profile_id: ctx.profile.id,
    chapter_role: 'chapter_admin',
    status: 'active',
  });

  revalidatePath('/dashboard/admin/chapters');
  revalidatePath('/chapters');
  revalidatePath('/');
  return { success: true, id: chapter.id, slug };
}

export async function reassignChapterAdmin(formData: FormData) {
  const { admin } = await requireSuperAdmin();

  const chapterId = String(formData.get('chapter_id') ?? '').trim();
  const newAdminProfileId = String(formData.get('profile_id') ?? '').trim();

  if (!chapterId || !newAdminProfileId) {
    return { error: 'Chapter and profile are required.' };
  }

  // Verify the new admin profile exists
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('id', newAdminProfileId)
    .maybeSingle();

  if (!profile) return { error: 'Profile not found.' };

  // Update the chapter's admin
  const { error: chapterError } = await admin
    .from('chapters')
    .update({ chapter_admin_id: newAdminProfileId })
    .eq('id', chapterId);

  if (chapterError) return { error: chapterError.message };

  // Ensure they have an active membership with chapter_admin role
  const { data: existing } = await admin
    .from('chapter_memberships')
    .select('id')
    .eq('chapter_id', chapterId)
    .eq('profile_id', newAdminProfileId)
    .maybeSingle();

  if (existing) {
    await admin
      .from('chapter_memberships')
      .update({ chapter_role: 'chapter_admin', status: 'active' })
      .eq('id', existing.id);
  } else {
    await admin.from('chapter_memberships').insert({
      chapter_id: chapterId,
      profile_id: newAdminProfileId,
      chapter_role: 'chapter_admin',
      status: 'active',
    });
  }

  // Notify the new admin
  await admin.from('notifications').insert({
    profile_id: newAdminProfileId,
    type: 'chapter_admin_assigned',
    title: 'You are now a chapter admin',
    body: 'You have been assigned as admin of a chapter. Visit the admin console to manage it.',
    link_url: '/dashboard/admin',
  });

  revalidatePath('/dashboard/admin/chapters');
  return { success: true };
}
