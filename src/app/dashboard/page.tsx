import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ReferralList from '@/components/ReferralList';
import MeetingList from '@/components/MeetingList';
import type { Referral, Meeting } from '@/lib/types';

export default async function DashboardPage() {
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  // Referrals involving this profile
  const { data: givenRaw } = await admin
    .from('referrals')
    .select(
      '*, from_profile:from_profile_id (first_name, last_name, email), to_profile:to_profile_id (first_name, last_name, email)',
    )
    .eq('from_profile_id', ctx.profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const { data: receivedRaw } = await admin
    .from('referrals')
    .select(
      '*, from_profile:from_profile_id (first_name, last_name, email), to_profile:to_profile_id (first_name, last_name, email)',
    )
    .eq('to_profile_id', ctx.profile.id)
    .order('created_at', { ascending: false })
    .limit(5);

  const given = (givenRaw ?? []) as Referral[];
  const received = (receivedRaw ?? []) as Referral[];

  const totalGiven = given.length;
  const totalReceived = received.length;
  const closedWonValue = [...given, ...received]
    .filter((r) => r.status === 'closed_won' && r.actual_value_cents)
    .reduce((sum, r) => sum + (r.actual_value_cents ?? 0), 0);

  // Upcoming meetings for the primary chapter
  let meetings: Meeting[] = [];
  if (ctx.primaryChapterId) {
    const { data: meetingRows } = await admin
      .from('meetings')
      .select('*')
      .eq('chapter_id', ctx.primaryChapterId)
      .eq('status', 'scheduled')
      .gte('meeting_date', new Date().toISOString().slice(0, 10))
      .order('meeting_date', { ascending: true })
      .limit(5);
    meetings = (meetingRows ?? []) as Meeting[];
  }

  const recentReferrals = [...given, ...received]
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400">
          Your referrals, your chapter, your network at a glance.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-gold">Given</div>
          <div className="mt-1 text-3xl font-bold text-white">{totalGiven}</div>
          <div className="text-xs text-gray-400">Referrals sent</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-gold">Received</div>
          <div className="mt-1 text-3xl font-bold text-white">{totalReceived}</div>
          <div className="text-xs text-gray-400">Referrals received</div>
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-gold">Closed value</div>
          <div className="mt-1 text-3xl font-bold text-white">
            ${(closedWonValue / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-xs text-gray-400">Total attributed revenue</div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-white">Recent referrals</h2>
            <Link href="/dashboard/referrals" className="btn-ghost">
              View all
            </Link>
          </div>
          <ReferralList referrals={recentReferrals} currentProfileId={ctx.profile.id} />
        </section>

        <aside>
          <h2 className="mb-3 font-serif text-xl font-bold text-white">
            Upcoming meetings
          </h2>
          <MeetingList meetings={meetings} />
          {ctx.primaryMembership?.status === 'pending' && (
            <div className="card mt-4 border-gold/40 bg-gold/5 text-sm text-gold">
              Your chapter application is pending review.
            </div>
          )}
          {!ctx.primaryMembership && (
            <div className="card mt-4 text-sm text-gray-300">
              You're not in a chapter yet.{' '}
              <Link href="/chapters" className="text-gold hover:underline">
                Find one near you.
              </Link>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
