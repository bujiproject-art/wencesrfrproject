import Link from 'next/link';
import Navbar from '@/components/Navbar';
import LoginForm from './LoginForm';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-md items-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full">
          <h1 className="font-serif text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-400">
            Log in to access your dashboard and referrals.
          </p>

          <div className="mt-8">
            <LoginForm next={next} initialError={error} />
          </div>

          <p className="mt-6 text-sm text-gray-400">
            No account yet?{' '}
            <Link href="/signup" className="text-gold hover:underline">
              Apply to join a chapter
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
