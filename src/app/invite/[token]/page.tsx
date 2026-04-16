import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { redeemInvitation } from '@/app/dashboard/admin/invites/actions';

interface Props { params: Promise<{ token: string }>; }

export default async function InviteRedemptionPage({ params }: Props) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/signup?invite=${encodeURIComponent(token)}`);
  }

  const result = await redeemInvitation(token);

  if (result.error) {
    const admin = createServiceRoleClient();
    await admin
      .from('invitations')
      .select('invitee_email, chapters:chapter_id(name)')
      .eq('invitation_token', token)
      .maybeSingle();

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-black">
        <div className="max-w-md w-full rounded-lg border border-gray-800 bg-[#1a1a1a] p-8 text-center">
          <h1 className="text-2xl font-bold text-[#D4AF37] mb-2">Invitation unavailable</h1>
          <p className="text-gray-400 text-sm mb-6">{result.error}</p>
          <Link href="/dashboard" className="inline-block bg-[#D4AF37] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#C4A030]">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  redirect('/dashboard?invited=true');
}
