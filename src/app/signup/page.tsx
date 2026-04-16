import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SignupForm from './SignupForm';
import { createClient } from '@/lib/supabase/server';

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ chapter?: string; invite?: string }>;
}) {
  const { chapter, invite } = await searchParams;
  const supabase = await createClient();
  const { data: chapters } = await supabase
    .from('chapters')
    .select('slug, name, city, state')
    .eq('status', 'active')
    .order('state', { ascending: true });

  let inviteEmail: string | null = null;
  let inviteChapterSlug: string | null = null;
  if (invite) {
    const { data: invitation } = await supabase
      .from('invitations')
      .select('invitee_email, status, expires_at, chapters:chapter_id(slug)')
      .eq('invitation_token', invite)
      .maybeSingle();

    if (
      invitation &&
      invitation.status === 'pending' &&
      (!invitation.expires_at || new Date(invitation.expires_at) > new Date())
    ) {
      inviteEmail = invitation.invitee_email;
      const ch = invitation.chapters as unknown as { slug?: string } | null;
      inviteChapterSlug = ch?.slug ?? null;
    }
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold text-white">
          {invite ? 'Accept your invitation' : 'Apply to join'}
        </h1>
        <p className="mt-2 text-sm text-gray-400">
          {invite
            ? 'Create your account to accept the invitation and become an active member.'
            : 'Create your account and (optionally) request a chapter. A chapter admin will review your application.'}
        </p>

        <div className="mt-8">
          <SignupForm
            defaultChapterSlug={inviteChapterSlug ?? chapter ?? ''}
            defaultEmail={inviteEmail ?? ''}
            inviteToken={invite ?? ''}
            chapters={chapters ?? []}
          />
        </div>

        <p className="mt-6 text-sm text-gray-400">
          Already a member?{' '}
          <Link href="/login" className="text-gold hover:underline">
            Log in
          </Link>
        </p>
      </main>
    </>
  );
}
