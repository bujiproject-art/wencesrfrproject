import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import type { Referral } from '@/lib/types';
import ReferralDetailView from './ReferralDetailView';

export default async function ReferralDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireUser();
  const admin = createServiceRoleClient();

  const { data } = await admin
    .from('referrals')
    .select(
      '*, from_profile:from_profile_id (first_name, last_name, email, company_name), to_profile:to_profile_id (first_name, last_name, email, company_name)',
    )
    .eq('id', id)
    .maybeSingle();

  if (!data) notFound();

  type Row = Referral & {
    from_profile: {
      first_name: string | null;
      last_name: string | null;
      email: string;
      company_name: string | null;
    } | null;
    to_profile: {
      first_name: string | null;
      last_name: string | null;
      email: string;
      company_name: string | null;
    } | null;
  };

  const referral = data as Row;
  const isRecipient = referral.to_profile_id === ctx.profile.id;
  const isGiver = referral.from_profile_id === ctx.profile.id;

  if (!isRecipient && !isGiver && !ctx.isSuperAdmin) {
    redirect('/dashboard/referrals');
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/referrals"
          className="text-xs text-gray-400 hover:text-gold"
        >
          ← Back to referrals
        </Link>
      </div>
      <ReferralDetailView
        referral={referral}
        fromProfile={referral.from_profile}
        toProfile={referral.to_profile}
        isRecipient={isRecipient}
        isGiver={isGiver}
      />
    </div>
  );
}
