import Link from 'next/link';
import type { Chapter } from '@/lib/types';

export default function ChapterCard({ chapter }: { chapter: Chapter }) {
  return (
    <Link
      href={`/chapters/${chapter.slug}`}
      className="card card-hover group flex flex-col justify-between"
    >
      <div>
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-white group-hover:text-gold">
            {chapter.name}
          </h3>
          <span className="badge bg-gold/10 text-gold">
            {chapter.member_count ?? 0} / {chapter.max_members ?? 50}
          </span>
        </div>
        <p className="text-sm text-gray-400">
          {chapter.city}, {chapter.state}
          {chapter.country && chapter.country !== 'US' ? `, ${chapter.country}` : ''}
        </p>
        {chapter.description && (
          <p className="mt-3 line-clamp-2 text-sm text-gray-300">{chapter.description}</p>
        )}
      </div>
      <div className="mt-4 border-t border-ink-600 pt-3 text-xs text-gray-500">
        {chapter.meeting_day ? (
          <>
            Meets {chapter.meeting_day}
            {chapter.meeting_time ? ` at ${chapter.meeting_time.slice(0, 5)}` : ''}
          </>
        ) : (
          'Meeting schedule TBA'
        )}
      </div>
    </Link>
  );
}
