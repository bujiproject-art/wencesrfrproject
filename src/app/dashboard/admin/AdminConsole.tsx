'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Chapter, Meeting } from '@/lib/types';
import {
  createMeeting,
  recordAttendance,
  approveMembership,
} from './actions';

type MemberRow = {
  id: string;
  chapter_id: string;
  profile_id: string;
  chapter_role: 'chapter_admin' | 'member';
  status: 'active' | 'pending' | 'suspended' | 'removed';
  joined_at: string;
  profile: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    company_name: string | null;
    business_category: string | null;
  } | null;
};

export default function AdminConsole({
  chapters,
  activeChapter,
  memberships,
  meetings,
  mostRecentMeetingId,
  attendanceByProfile,
}: {
  chapters: Chapter[];
  activeChapter: Chapter;
  memberships: MemberRow[];
  meetings: Meeting[];
  mostRecentMeetingId: string | null;
  attendanceByProfile: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [attendanceMeetingId, setAttendanceMeetingId] = useState<string>(
    mostRecentMeetingId ?? '',
  );

  const pendingCount = memberships.filter((m) => m.status === 'pending').length;
  const activeMembers = memberships.filter((m) => m.status === 'active');

  function handleCreateMeeting(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const r = await createMeeting(formData);
      if (r?.error) setError(r.error);
      else router.refresh();
    });
  }

  function handleApprove(membershipId: string) {
    setError(null);
    const fd = new FormData();
    fd.set('chapter_id', activeChapter.id);
    fd.set('membership_id', membershipId);
    startTransition(async () => {
      const r = await approveMembership(fd);
      if (r?.error) setError(r.error);
      else router.refresh();
    });
  }

  function handleAttendance(profileId: string, status: string) {
    if (!attendanceMeetingId) {
      setError('Select a meeting first.');
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set('chapter_id', activeChapter.id);
    fd.set('meeting_id', attendanceMeetingId);
    fd.set('profile_id', profileId);
    fd.set('status', status);
    startTransition(async () => {
      const r = await recordAttendance(fd);
      if (r?.error) setError(r.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Chapter admin</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage {activeChapter.name}.
          </p>
        </div>
        {chapters.length > 1 && (
          <form>
            <select
              className="input"
              defaultValue={activeChapter.slug}
              onChange={(e) => {
                router.push(`/dashboard/admin?chapter=${e.target.value}`);
              }}
            >
              {chapters.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </form>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      {/* Pending applications */}
      {pendingCount > 0 && (
        <section className="card">
          <h2 className="font-serif text-lg font-semibold text-white">
            Pending applications ({pendingCount})
          </h2>
          <ul className="mt-4 divide-y divide-ink-600">
            {memberships
              .filter((m) => m.status === 'pending')
              .map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-4 py-3 text-sm"
                >
                  <div>
                    <div className="text-white">
                      {m.profile
                        ? [m.profile.first_name, m.profile.last_name]
                            .filter(Boolean)
                            .join(' ') || m.profile.email
                        : 'Unknown'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {m.profile?.email}
                      {m.profile?.company_name ? ` • ${m.profile.company_name}` : ''}
                    </div>
                  </div>
                  <button
                    disabled={pending}
                    onClick={() => handleApprove(m.id)}
                    className="btn-gold"
                  >
                    Approve
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}

      {/* Member roster */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-serif text-xl font-bold text-white">
            Member roster ({activeMembers.length})
          </h2>
          {meetings.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-400">Attendance for meeting:</label>
              <select
                className="input !w-auto !py-1 text-xs"
                value={attendanceMeetingId}
                onChange={(e) => setAttendanceMeetingId(e.target.value)}
              >
                <option value="">— select —</option>
                {meetings.map((m) => (
                  <option key={m.id} value={m.id}>
                    {new Date(m.meeting_date).toLocaleDateString()} — {m.title}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
          <table className="min-w-full divide-y divide-ink-600">
            <thead className="bg-ink-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gold">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gold">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gold">
                  Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gold">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-600">
              {activeMembers.map((m) => {
                const current = attendanceByProfile[m.profile_id] ?? '';
                const name = m.profile
                  ? [m.profile.first_name, m.profile.last_name]
                      .filter(Boolean)
                      .join(' ') || m.profile.email
                  : 'Unknown';
                return (
                  <tr key={m.id}>
                    <td className="px-4 py-3 text-sm text-white">
                      {name}
                      <div className="text-xs text-gray-400">
                        {m.profile?.company_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-300">
                      {m.profile?.business_category ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`badge ${
                          m.chapter_role === 'chapter_admin'
                            ? 'bg-gold/10 text-gold'
                            : 'bg-gray-500/10 text-gray-300'
                        }`}
                      >
                        {m.chapter_role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        defaultValue={current}
                        disabled={pending || !attendanceMeetingId}
                        onChange={(e) =>
                          handleAttendance(m.profile_id, e.target.value)
                        }
                        className="input !w-auto !py-1 text-xs"
                      >
                        <option value="">—</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                        <option value="substitute">Substitute</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Create meeting */}
      <section>
        <h2 className="mb-3 font-serif text-xl font-bold text-white">Create meeting</h2>
        <form action={handleCreateMeeting} className="card grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="chapter_id" value={activeChapter.id} />
          <div className="sm:col-span-2">
            <label className="label" htmlFor="title">
              Title *
            </label>
            <input id="title" name="title" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="meeting_date">
              Date *
            </label>
            <input
              type="date"
              id="meeting_date"
              name="meeting_date"
              required
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="meeting_time">
              Time *
            </label>
            <input
              type="time"
              id="meeting_time"
              name="meeting_time"
              required
              className="input"
              defaultValue={activeChapter.meeting_time?.slice(0, 5) ?? '07:30'}
            />
          </div>
          <div>
            <label className="label" htmlFor="location">
              Location
            </label>
            <input
              id="location"
              name="location"
              className="input"
              defaultValue={activeChapter.meeting_location ?? ''}
            />
          </div>
          <div>
            <label className="label" htmlFor="virtual_link">
              Virtual link
            </label>
            <input id="virtual_link" name="virtual_link" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">
              Description
            </label>
            <textarea id="description" name="description" rows={3} className="input" />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" disabled={pending} className="btn-gold">
              {pending ? 'Saving…' : 'Create meeting'}
            </button>
          </div>
        </form>
      </section>

      {/* Recent meetings */}
      <section>
        <h2 className="mb-3 font-serif text-xl font-bold text-white">Recent meetings</h2>
        {meetings.length === 0 ? (
          <div className="card text-sm text-gray-400">No meetings yet.</div>
        ) : (
          <ul className="space-y-2">
            {meetings.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-md border border-ink-500 bg-ink-800 p-3 text-sm"
              >
                <div>
                  <div className="font-medium text-white">{m.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(m.meeting_date).toLocaleDateString()} at{' '}
                    {m.meeting_time.slice(0, 5)} · {m.attendance_count} present
                  </div>
                </div>
                <span
                  className={`badge ${
                    m.status === 'scheduled'
                      ? 'bg-gold/10 text-gold'
                      : m.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                  }`}
                >
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
