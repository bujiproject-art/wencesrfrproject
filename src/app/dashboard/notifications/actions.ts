'use server';

import { revalidatePath } from 'next/cache';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function markNotificationRead(formData: FormData) {
  const notificationId = String(formData.get('notification_id') ?? '').trim();
  if (!notificationId) return { error: 'Missing notification id.' };

  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('profile_id', ctx.profile.id);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');
  return { success: true };
}

export async function markAllNotificationsRead() {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const { error } = await admin
    .from('notifications')
    .update({ is_read: true })
    .eq('profile_id', ctx.profile.id)
    .eq('is_read', false);

  if (error) return { error: error.message };
  revalidatePath('/dashboard/notifications');
  revalidatePath('/dashboard');
  return { success: true };
}
