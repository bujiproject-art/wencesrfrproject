import type { Meeting } from '@/lib/types';

export default function MeetingList({ meetings }: { meetings: Meeting[] }) {
  if (!meetings.length) {
    return (
      <div className="card text-sm text-gray-400">No upcoming meetings scheduled.</div>
    );
  }

  return (
    <ul className="space-y-3">
      {meetings.map((m) => (
        <li
          key={m.id}
          className="flex items-start justify-between gap-4 rounded-lg border border-ink-500 bg-ink-800 p-4"
        >
          <div>
            <div className="font-medium text-white">{m.title}</div>
            <div className="text-xs text-gray-400">
              {new Date(m.meeting_date).toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}{' '}
              at {m.meeting_time?.slice(0, 5)}
            </div>
            {m.location && (
              <div className="mt-1 text-xs text-gray-500">{m.location}</div>
            )}
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
  );
}
