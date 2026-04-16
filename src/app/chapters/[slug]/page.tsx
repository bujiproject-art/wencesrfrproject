import Link from 'next/link';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Chapter, Profile, ChapterMembership, Meeting } from '@/lib/types';

export const revalidate = 30;

type MembershipWithProfile = ChapterMembership & { profiles: Profile | null };

export default async function ChapterDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Public chapter lookup (RLS allows active chapters)
  const supabase = await createClient();
  const { data: chapter } = await supabase
    .from('chapters')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!chapter) return notFound();

  // Public roster — service role so unauthenticated visitors see the lineup (public bio).
  // We only expose safe fields in the UI.
  const admin = createServiceRoleClient();
  const { data: memberships } = await admin
    .from('chapter_memberships')
    .select(
      'id, chapter_id, profile_id, chapter_role, status, joined_at, profiles:profile_id (id, first_name, last_name, company_name, business_category, bio, avatar_url, linkedin_url, website)',
    )
    .eq('chapter_id', chapter.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: true });

  const { data: meetings } = await admin
    .from('meetings')
    .select('*')
    .eq('chapter_id', chapter.id)
    .eq('status', 'scheduled')
    .gte('meeting_date', new Date().toISOString().slice(0, 10))
    .order('meeting_date', { ascending: true })
    .limit(4);

  const typedChapter = chapter as Chapter;
  const typedMembers = (memberships ?? []) as unknown as MembershipWithProfile[];
  const typedMeetings = (meetings ?? []) as Meeting[];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="border-b border-ink-600">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-gold">
            {typedChapter.city}, {typedChapter.state}
          </p>
          <h1 className="font-serif text-4xl font-bold text-white sm:text-5xl">
            {typedChapter.name}
          </h1>
          {typedChapter.description && (
            <p className="mt-4 max-w-3xl text-lg text-gray-300">
              {typedChapter.description}
            </p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/signup?chapter=${typedChapter.slug}`} className="btn-gold">
              Apply to this chapter
            </Link>
            <Link href="/chapters" className="btn-outline">
              All chapters
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
          {/* Members */}
          <section>
            <h2 className="mb-4 font-serif text-2xl font-bold text-white">
              Members ({typedMembers.length})
            </h2>
            {typedMembers.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {typedMembers.map((m) => {
                  const p = m.profiles;
                  if (!p) return null;
                  const name =
                    [p.first_name, p.last_name].filter(Boolean).join(' ').trim() ||
                    'Member';
                  return (
                    <div key={m.id} className="card">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/20 text-sm font-semibold text-gold">
                          {(p.first_name?.[0] ?? '').toUpperCase()}
                          {(p.last_name?.[0] ?? '').toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">{name}</div>
                          {p.company_name && (
                            <div className="text-xs text-gray-400">{p.company_name}</div>
                          )}
                        </div>
                        {m.chapter_role === 'chapter_admin' && (
                          <span className="badge ml-auto bg-gold/10 text-gold">Admin</span>
                        )}
                      </div>
                      {p.business_category && (
                        <div className="mt-3 text-xs uppercase tracking-wider text-gold">
                          {p.business_category}
                        </div>
                      )}
                      {p.bio && (
                        <p className="mt-2 line-clamp-3 text-sm text-gray-300">{p.bio}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="card text-sm text-gray-400">
                This chapter is new — be among the founding members.
              </div>
            )}
          </section>

          {/* Sidebar */}
          <aside className="space-y-6">
            <div className="card">
              <h3 className="mb-3 font-serif text-lg font-semibold text-white">
                Meeting schedule
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-400">Day</dt>
                  <dd className="text-white">{typedChapter.meeting_day ?? 'TBA'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Time</dt>
                  <dd className="text-white">
                    {typedChapter.meeting_time
                      ? typedChapter.meeting_time.slice(0, 5)
                      : 'TBA'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Location</dt>
                  <dd className="text-white">{typedChapter.meeting_location ?? 'TBA'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-400">Capacity</dt>
                  <dd className="text-white">
                    {typedChapter.member_count ?? 0} / {typedChapter.max_members ?? 50}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="card">
              <h3 className="mb-3 font-serif text-lg font-semibold text-white">
                Upcoming meetings
              </h3>
              {typedMeetings.length ? (
                <ul className="space-y-2 text-sm">
                  {typedMeetings.map((m) => (
                    <li key={m.id} className="border-b border-ink-600 pb-2 last:border-0">
                      <div className="font-medium text-white">{m.title}</div>
                      <div className="text-xs text-gray-400">
                        {new Date(m.meeting_date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        at {m.meeting_time.slice(0, 5)}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400">No meetings scheduled yet.</p>
              )}
            </div>

            <div className="card">
              <h3 className="mb-2 font-serif text-lg font-semibold text-white">
                Interested?
              </h3>
              <p className="mb-4 text-sm text-gray-300">
                One seat per business category. If your category is open, you can apply to
                join this chapter today.
              </p>
              <Link
                href={`/signup?chapter=${typedChapter.slug}`}
                className="btn-gold w-full"
              >
                Join this chapter
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
