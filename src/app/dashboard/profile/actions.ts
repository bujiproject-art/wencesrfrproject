'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

const ALLOWED_FIELDS = [
  'first_name',
  'last_name',
  'phone',
  'company_name',
  'business_category',
  'website',
  'linkedin_url',
  'bio',
  'city',
  'state',
] as const;

export async function updateProfile(formData: FormData) {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const patch: Record<string, string | null> = {};
  for (const field of ALLOWED_FIELDS) {
    const raw = formData.get(field);
    if (raw === null) continue;
    const v = String(raw).trim();
    patch[field] = v === '' ? null : v;
  }

  const { error } = await admin
    .from('profiles')
    .update(patch)
    .eq('id', ctx.profile.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function uploadAvatar(formData: FormData): Promise<{ error?: string; url?: string }> {
  const ctx = await requireUser();
  const file = formData.get('avatar');

  if (!(file instanceof File) || file.size === 0) {
    return { error: 'No file provided.' };
  }
  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File must be under 5MB.' };
  }
  if (!file.type.startsWith('image/')) {
    return { error: 'File must be an image.' };
  }

  const admin = createServiceRoleClient();
  const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase();
  const path = `${ctx.profile.id}/original.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
      cacheControl: '3600',
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}. Ensure the 'avatars' storage bucket exists in Supabase and is public.` };
  }

  const { data: pub } = admin.storage.from('avatars').getPublicUrl(path);
  const publicUrl = pub.publicUrl;

  const { error: updateError } = await admin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', ctx.profile.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/dashboard/profile');
  revalidatePath('/dashboard');
  return { success: true, url: publicUrl } as { success: true; url: string };
}
