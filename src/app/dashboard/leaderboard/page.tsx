import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Chapter, Profile, Referral } from '@/lib/types';

type Period = 'month' | 'all';

type LeaderRow = {
  profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email' | 'company_name'>;
  given: number;
  won: number;
  value_cents: number;
};

function displayName(
  p: Pick<Profile, 'first_name' | 'last_name' | 'email'>,
): string {
  return [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email;
}

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; period?: string }>;
}) {
  const { chapter: chapterSlugParam, period: periodParam } = await searchParams;
  const period: Period = periodParam === 'all' ? 'all' : 'month';

  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  let visibleChapters: Chapter[] = [];
  if (ctx.isSuperAdmin) {
    const { data } = await admin
      .from('chapters')
      .select('*')
      .eq('status', 'active')
      .order('state', { ascending: true })
      .order('city', { ascending: true });
    visibleChapters = (data ?? []) as Chapter[];
  } else {
    const memberChapterIds = ctx.memberships
      .filter((m) => m.status === 'active')
      .map((m) => m.chapter_id);
    if (memberChapterIds.length) {
      const { data } = await admin
        .from('chapters')
        .select('*')
        .in('id', memberChapterIds);
      visibleChapters = (data ?? []) as Chapter[];
    }
  }

  if (!visibleChapters.length) {
    return (
      <div className="card">
        <h1 className="font-serif text-2xl font-bold text-white">Leaderboard</h1>
        <p className="mt-2 text-gray-300">
          Join a chapter to see the leaderboard.
        </p>
        <Link href="/chapters" className="btn-gold mt-4">
          Find a chapter
        </Link>
      </div>
    );
  }

  const activeChapter =
    visibleChapters.find((c) => c.slug === chapterSlugParam) ?? visibleChapters[0];

  let query = admin
    .from('referrals')
    .select(
      'id, from_profile_id, status, actual_value_cents, created_at, from_profile:from_profile_id (id, first_name, last_name, email, company_name)',
    )
    .eq('chapter_id', activeChapter.id);

  if (period === 'month') {
    query = query.gte('created_at', startOfMonthISO());
  }

  const { data: referralsRaw } = await query;

  type ReferralWithProfile = Pick<Referral, 'id' | 'from_profile_id' | 'status' | 'actual_value_cents' | 'created_at'> & {
    from_profile: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email' | 'company_name'> | null;
  };

  const referrals = (referralsRaw ?? []) as unknown as ReferralWithProfile[];

  const byProfile = new Map<string, LeaderRow>();

  for (const r of referrals) {
    if (!r.from_profile) continue;
    const key = r.from_profile.id;
    const row = byProfile.get(key) ?? {
      profile: r.from_profile,
      given: 0,
      won: 0,
      value_cents: 0,
    };
    row.given += 1;
    if (r.status === 'closed_won') {
      row.won += 1;
      row.value_cents += r.actual_value_cents ?? 0;
    }
    byProfile.set(key, row);
  }

  const rows = Array.from(byProfile.values());

  const topGiven = [...rows].sort((a, b) => b.given - a.given).slice(0, 10);
  const topWon = [...rows].sort((a, b) => b.won - a.won || b.value_cents - a.value_cents).slice(0, 10);
  const topValue = [...rows].sort((a, b) => b.value_cents - a.value_cents).slice(0, 10);

  const buildHref = (p: Period, slug: string) =>
    `/dashboard/leaderboard?chapter=${slug}&period=${p}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Leaderboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            {activeChapter.name} — {period === 'month' ? 'this month' : 'all time'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {visibleChapters.length > 1 && (
            <form method="get" className="flex items-center gap-2">
              <input type="hidden" name="period" value={period} />
              <select
                name="chapter"
                defaultValue={activeChapter.slug}
                className="input !w-auto"
              >
                {visibleChapters.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-outline">Go</button>
            </form>
          )}
          <div className="inline-flex rounded-md border border-ink-500 bg-ink-800">
            <Link
              href={buildHref('month', activeChapter.slug)}
              className={`px-3 py-2 text-xs font-semibold ${
                period === 'month' ? 'bg-gold text-ink-900' : 'text-gray-300 hover:text-white'
              }`}
            >
              This month
            </Link>
            <Link
              href={buildHref('all', activeChapter.slug)}
              className={`px-3 py-2 text-xs font-semibold ${
                period === 'all' ? 'bg-gold text-ink-900' : 'text-gray-300 hover:text-white'
              }`}
            >
              All time
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <LeaderCard
          title="Most referrals given"
          rows={topGiven}
          metricLabel="given"
          format={(r) => `${r.given}`}
        />
        <LeaderCard
          title="Most closed-won"
          rows={topWon}
          metricLabel="won"
          format={(r) => `${r.won}`}
        />
        <LeaderCard
          title="Most value closed"
          rows={topValue}
          metricLabel="value"
          format={(r) =>
            `$${(r.value_cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
          }
        />
      </div>
    </div>
  );
}

function LeaderCard({
  title,
  rows,
  metricLabel,
  format,
}: {
  title: string;
  rows: LeaderRow[];
  metricLabel: string;
  format: (r: LeaderRow) => string;
}) {
  return (
    <div className="card">
      <h2 className="mb-3 text-xs uppercase tracking-wider text-gold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, idx) => (
            <li
              key={r.profile.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0
                      ? 'bg-gold text-ink-900'
                      : idx <= 2
                        ? 'bg-gold/20 text-gold'
                        : 'bg-ink-700 text-gray-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <div>
                  <div className="text-white">{displayName(r.profile)}</div>
                  {r.profile.company_name && (
                    <div className="text-xs text-gray-500">{r.profile.company_name}</div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gold">{format(r)}</div>
                <div className="text-[10px] uppercase tracking-wider text-gray-500">
                  {metricLabel}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
