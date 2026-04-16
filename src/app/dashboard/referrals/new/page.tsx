import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ReferralForm from '@/components/ReferralForm';

export default async function NewReferralPage() {
  const ctx = await requireUser();

  if (!ctx.primaryChapterId) {
    return (
      <div className="card">
        <h1 className="font-serif text-2xl font-bold text-white">
          Join a chapter first
        </h1>
        <p className="mt-2 text-gray-300">
          You need to belong to an active chapter before you can submit referrals.
        </p>
        <Link href="/chapters" className="btn-gold mt-4">
          Find a chapter
        </Link>
      </div>
    );
  }

  const admin = createServiceRoleClient();

  // Fetch active members of the user's primary chapter (exclude themselves)
  const { data: members } = await admin
    .from('chapter_memberships')
    .select(
      'profile_id, profiles:profile_id (first_name, last_name, email, company_name)',
    )
    .eq('chapter_id', ctx.primaryChapterId)
    .eq('status', 'active')
    .neq('profile_id', ctx.profile.id);

  type Row = {
    profile_id: string;
    profiles: {
      first_name: string | null;
      last_name: string | null;
      email: string;
      company_name: string | null;
    } | null;
  };

  const options = ((members ?? []) as unknown as Row[])
    .filter((m) => m.profiles)
    .map((m) => ({
      profile_id: m.profile_id,
      first_name: m.profiles!.first_name,
      last_name: m.profiles!.last_name,
      email: m.profiles!.email,
      company_name: m.profiles!.company_name,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-bold text-white">Submit a referral</h1>
        <p className="mt-1 text-sm text-gray-400">
          Pass a warm prospect to a fellow chapter member.
        </p>
      </div>

      {options.length === 0 ? (
        <div className="card text-gray-300">
          Your chapter doesn't have any other active members yet. Invite a friend to join!
        </div>
      ) : (
        <ReferralForm chapterId={ctx.primaryChapterId} members={options} />
      )}
    </div>
  );
}
