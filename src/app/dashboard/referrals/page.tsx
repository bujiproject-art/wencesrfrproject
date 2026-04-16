import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ReferralList from '@/components/ReferralList';
import type { Referral, ReferralStatus } from '@/lib/types';
import { REFERRAL_STATUS_LABELS } from '@/lib/types';

const ALL_STATUSES: ReferralStatus[] = [
  'submitted',
  'contacted',
  'meeting_set',
  'in_progress',
  'closed_won',
  'closed_lost',
  'declined',
];

export default async function ReferralsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; dir?: string }>;
}) {
  const { status, dir } = await searchParams;
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  let query = admin
    .from('referrals')
    .select(
      '*, from_profile:from_profile_id (first_name, last_name, email), to_profile:to_profile_id (first_name, last_name, email)',
    )
    .order('created_at', { ascending: false });

  if (dir === 'given') {
    query = query.eq('from_profile_id', ctx.profile.id);
  } else if (dir === 'received') {
    query = query.eq('to_profile_id', ctx.profile.id);
  } else {
    query = query.or(
      `from_profile_id.eq.${ctx.profile.id},to_profile_id.eq.${ctx.profile.id}`,
    );
  }

  if (status && ALL_STATUSES.includes(status as ReferralStatus)) {
    query = query.eq('status', status);
  }

  const { data: referralsRaw } = await query;
  const referrals = (referralsRaw ?? []) as Referral[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">Referrals</h1>
          <p className="mt-1 text-sm text-gray-400">
            All referrals you've given or received.
          </p>
        </div>
        <Link href="/dashboard/referrals/new" className="btn-gold">
          + New referral
        </Link>
      </div>

      <form className="card flex flex-wrap gap-3">
        <div className="flex-1 min-w-[160px]">
          <label className="label" htmlFor="dir">
            Direction
          </label>
          <select id="dir" name="dir" defaultValue={dir ?? ''} className="input">
            <option value="">All</option>
            <option value="given">Given by me</option>
            <option value="received">Received by me</option>
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="label" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" defaultValue={status ?? ''} className="input">
            <option value="">All statuses</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {REFERRAL_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-gold">
            Filter
          </button>
        </div>
      </form>

      <ReferralList referrals={referrals} currentProfileId={ctx.profile.id} />
    </div>
  );
}
