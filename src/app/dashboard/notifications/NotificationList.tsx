'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/types';
import { markNotificationRead, markAllNotificationsRead } from './actions';

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  function handleMarkRead(id: string) {
    const fd = new FormData();
    fd.set('notification_id', id);
    startTransition(async () => {
      await markNotificationRead(fd);
      router.refresh();
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  if (!notifications.length) {
    return (
      <div className="card text-center text-gray-400">
        You don't have any notifications yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            {unreadCount} unread
          </span>
          <button
            type="button"
            className="btn-ghost text-xs"
            disabled={pending}
            onClick={handleMarkAll}
          >
            Mark all as read
          </button>
        </div>
      )}
      <ul className="overflow-hidden rounded-lg border border-ink-500 bg-ink-800 divide-y divide-ink-600">
        {notifications.map((n) => {
          const body = (
            <div className="flex items-start justify-between gap-4 px-4 py-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {!n.is_read && (
                    <span className="inline-block h-2 w-2 rounded-full bg-gold" aria-hidden />
                  )}
                  <span
                    className={`text-sm ${n.is_read ? 'text-gray-300' : 'font-semibold text-white'}`}
                  >
                    {n.title}
                  </span>
                </div>
                {n.body && (
                  <p className="mt-1 text-sm text-gray-400">{n.body}</p>
                )}
                <div className="mt-1 text-xs text-gray-500">{timeAgo(n.created_at)}</div>
              </div>
              {!n.is_read && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleMarkRead(n.id);
                  }}
                  disabled={pending}
                  className="text-xs text-gold hover:underline"
                >
                  Mark read
                </button>
              )}
            </div>
          );

          return (
            <li key={n.id} className={n.is_read ? '' : 'bg-gold/5'}>
              {n.link_url ? (
                <Link
                  href={n.link_url}
                  className="block hover:bg-ink-700/50"
                  onClick={() => {
                    if (!n.is_read) handleMarkRead(n.id);
                  }}
                >
                  {body}
                </Link>
              ) : (
                body
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
