import Link from 'next/link';
import { createServiceRoleClient } from '@/lib/supabase/server';

export default async function NavbarBell({ profileId }: { profileId: string }) {
  const admin = createServiceRoleClient();
  const { count } = await admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  const unread = count ?? 0;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative btn-ghost px-2"
      aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-ink-900">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </Link>
  );
}
