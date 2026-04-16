import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { requireUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireUser();
  const displayName =
    [ctx.profile.first_name, ctx.profile.last_name].filter(Boolean).join(' ').trim() ||
    ctx.email;

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card mb-4">
              <div className="text-xs uppercase tracking-wider text-gold">Signed in as</div>
              <div className="mt-1 truncate text-sm font-medium text-white">
                {displayName}
              </div>
              {ctx.primaryMembership && (
                <div className="mt-1 text-xs text-gray-400">
                  Chapter: {ctx.memberships[0]?.chapter_name ?? '—'}
                </div>
              )}
            </div>
            <nav className="space-y-1">
              <Link
                href="/dashboard"
                className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Overview
              </Link>
              <Link
                href="/dashboard/referrals"
                className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Referrals
              </Link>
              <Link
                href="/dashboard/referrals/new"
                className="block rounded-md px-3 py-2 text-sm text-gold hover:bg-gold/10"
              >
                + New referral
              </Link>
              <Link
                href="/dashboard/leaderboard"
                className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Leaderboard
              </Link>
              <Link
                href="/dashboard/notifications"
                className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                Notifications
              </Link>
              <Link
                href="/dashboard/profile"
                className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
              >
                My profile
              </Link>
              {ctx.isChapterAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Chapter admin
                </Link>
              )}
              {ctx.isSuperAdmin && (
                <Link
                  href="/dashboard/admin/chapters"
                  className="block rounded-md px-3 py-2 text-sm text-gold hover:bg-gold/10"
                >
                  All chapters
                </Link>
              )}
              <form action="/auth/signout" method="post" className="pt-2">
                <button
                  type="submit"
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-400 hover:bg-white/5 hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </>
  );
}
