import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Notification } from '@/lib/types';
import NotificationList from './NotificationList';

export default async function NotificationsPage() {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const { data } = await admin
    .from('notifications')
    .select('*')
    .eq('profile_id', ctx.profile.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const notifications = (data ?? []) as Notification[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-white">Notifications</h1>
        <p className="mt-1 text-sm text-gray-400">
          Recent activity on your referrals, meetings, and membership.
        </p>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
