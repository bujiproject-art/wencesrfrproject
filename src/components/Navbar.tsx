import Link from 'next/link';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import NavbarBell from '@/components/NavbarBell';
import Logo from '@/components/Logo';

export default async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profileId: string | null = null;
  if (user) {
    const admin = createServiceRoleClient();
    const { data } = await admin
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    profileId = data?.id ?? null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-ink-600 bg-ink-900/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-serif text-xl font-bold tracking-wide text-gold">
            RFR Network
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link href="/chapters" className="btn-ghost">
            Chapters
          </Link>
          <Link href="/about" className="btn-ghost">
            About
          </Link>
          {user ? (
            <>
              <Link href="/dashboard" className="btn-ghost">
                Dashboard
              </Link>
              {profileId && <NavbarBell profileId={profileId} />}
              <form action="/auth/signout" method="post">
                <button type="submit" className="btn-ghost">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/signup" className="btn-gold">
                Join
              </Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-2 md:hidden">
          {user && profileId && <NavbarBell profileId={profileId} />}
          <Link href="/chapters" className="btn-ghost">
            Chapters
          </Link>
          {user ? (
            <Link href="/dashboard" className="btn-gold">
              Dashboard
            </Link>
          ) : (
            <Link href="/signup" className="btn-gold">
              Join
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
