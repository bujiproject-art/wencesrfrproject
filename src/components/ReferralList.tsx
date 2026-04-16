import Link from 'next/link';
import { REFERRAL_STATUS_LABELS, type Referral, type ReferralStatus } from '@/lib/types';

type ReferralWithParties = Referral & {
  from_profile?: { first_name: string | null; last_name: string | null; email: string } | null;
  to_profile?: { first_name: string | null; last_name: string | null; email: string } | null;
};

function statusBadgeClass(status: ReferralStatus): string {
  switch (status) {
    case 'closed_won':
      return 'bg-emerald-500/10 text-emerald-400';
    case 'closed_lost':
    case 'declined':
      return 'bg-rose-500/10 text-rose-400';
    case 'in_progress':
    case 'meeting_set':
      return 'bg-gold/10 text-gold';
    case 'contacted':
      return 'bg-sky-500/10 text-sky-400';
    default:
      return 'bg-gray-500/10 text-gray-300';
  }
}

function profileName(
  p: { first_name: string | null; last_name: string | null; email: string } | null | undefined,
): string {
  if (!p) return '—';
  const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return n || p.email;
}

export default function ReferralList({
  referrals,
  currentProfileId,
}: {
  referrals: ReferralWithParties[];
  currentProfileId: string;
}) {
  if (!referrals.length) {
    return (
      <div className="card text-center">
        <p className="text-gray-400">No referrals yet.</p>
        <Link href="/dashboard/referrals/new" className="btn-gold mt-4">
          Submit your first referral
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
      <div className="hidden sm:grid grid-cols-[2fr_1fr_2fr_1.2fr_1fr] gap-3 bg-ink-700 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gold">
        <div>Prospect</div>
        <div>Direction</div>
        <div>Counterparty</div>
        <div>Status</div>
        <div>Date</div>
      </div>
      <ul className="divide-y divide-ink-600">
        {referrals.map((r) => {
          const iGave = r.from_profile_id === currentProfileId;
          const counterparty = iGave ? r.to_profile : r.from_profile;
          return (
            <li key={r.id}>
              <Link
                href={`/dashboard/referrals/${r.id}`}
                className="block px-4 py-3 text-sm hover:bg-ink-700/50 sm:grid sm:grid-cols-[2fr_1fr_2fr_1.2fr_1fr] sm:gap-3 sm:items-center"
              >
                <div className="text-white">
                  <div className="font-medium">{r.referred_name}</div>
                  {r.referred_company && (
                    <div className="text-xs text-gray-400">{r.referred_company}</div>
                  )}
                  <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                    <span
                      className={`badge ${
                        iGave ? 'bg-gold/10 text-gold' : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      {iGave ? 'Given' : 'Received'}
                    </span>
                    <span className={`badge ${statusBadgeClass(r.status)}`}>
                      {REFERRAL_STATUS_LABELS[r.status]}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-gray-400 sm:hidden">
                    {iGave ? 'Given to' : 'From'} {profileName(counterparty)}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <span
                    className={`badge ${
                      iGave ? 'bg-gold/10 text-gold' : 'bg-emerald-500/10 text-emerald-400'
                    }`}
                  >
                    {iGave ? 'Given' : 'Received'}
                  </span>
                </div>
                <div className="hidden sm:block text-gray-300">{profileName(counterparty)}</div>
                <div className="hidden sm:block">
                  <span className={`badge ${statusBadgeClass(r.status)}`}>
                    {REFERRAL_STATUS_LABELS[r.status]}
                  </span>
                </div>
                <div className="hidden sm:block text-gray-400">
                  {new Date(r.created_at).toLocaleDateString()}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
