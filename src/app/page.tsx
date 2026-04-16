import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ChapterCard from '@/components/ChapterCard';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Chapter, Profile, Testimonial } from '@/lib/types';

export const revalidate = 60;

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('chapters')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(6);

  if (q && q.trim()) {
    const pattern = `%${q.trim()}%`;
    query = query.or(`city.ilike.${pattern},state.ilike.${pattern},name.ilike.${pattern}`);
  }

  const { data: chapters } = await query;

  // Public testimonials (use service role since public homepage has no auth session)
  const admin = createServiceRoleClient();
  const { data: testimonialsRaw } = await admin
    .from('testimonials')
    .select(
      '*, from_profile:from_profile_id (first_name, last_name, company_name, city, state), to_profile:to_profile_id (first_name, last_name, company_name)',
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(3);

  type TestimonialRow = Testimonial & {
    from_profile: Pick<
      Profile,
      'first_name' | 'last_name' | 'company_name' | 'city' | 'state'
    > | null;
    to_profile: Pick<Profile, 'first_name' | 'last_name' | 'company_name'> | null;
  };

  const testimonials = (testimonialsRaw ?? []) as unknown as TestimonialRow[];

  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ink-600">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.25), transparent 50%), radial-gradient(circle at 80% 60%, rgba(212,175,55,0.15), transparent 60%)',
          }}
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
              RFR Network
            </p>
            <h1 className="font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
              Connection is <span className="text-gold">currency.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-gray-300 sm:text-xl">
              A premium, invitation-driven referral network for business builders who are
              done trading time for pitches. Join a chapter, give great referrals, and
              compound your reputation.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/chapters" className="btn-gold">
                Find a chapter
              </Link>
              <Link href="/signup" className="btn-outline">
                Apply to join
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter finder */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              Find your chapter
            </h2>
            <p className="mt-2 text-gray-400">
              Search active chapters by city, state, or name.
            </p>
          </div>
          <form className="flex w-full max-w-md items-center gap-2 sm:w-auto">
            <input
              type="text"
              name="q"
              defaultValue={q ?? ''}
              placeholder="Miami, Houston, Los Angeles…"
              className="input"
            />
            <button type="submit" className="btn-gold whitespace-nowrap">
              Search
            </button>
          </form>
        </div>

        {chapters && chapters.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c) => (
              <ChapterCard key={c.id} chapter={c as Chapter} />
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-400">
            No chapters found{q ? ` for "${q}"` : ''}. Check back soon — we're opening new
            chapters every month.
          </div>
        )}

        <div className="mt-8 text-center">
          <Link href="/chapters" className="btn-outline">
            View all chapters
          </Link>
        </div>
      </section>

      {/* Testimonials — only render when members have opted in to make them public */}
      {testimonials.length > 0 && (
        <section className="border-t border-ink-600 bg-ink-800/30">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="mb-10">
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
                Members say
              </p>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
                Real referrals. Real revenue.
              </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((t) => {
                const authorName =
                  [t.from_profile?.first_name, t.from_profile?.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim() || 'RFR member';
                const authorMeta = [
                  t.from_profile?.company_name,
                  t.from_profile?.city && t.from_profile?.state
                    ? `${t.from_profile.city}, ${t.from_profile.state}`
                    : null,
                ]
                  .filter(Boolean)
                  .join(' · ');

                return (
                  <figure key={t.id} className="card h-full">
                    <blockquote className="text-sm leading-relaxed text-gray-200">
                      \u201C{t.content}\u201D
                    </blockquote>
                    <figcaption className="mt-4 border-t border-ink-600 pt-3 text-xs">
                      <div className="text-gold">{authorName}</div>
                      {authorMeta && (
                        <div className="text-gray-500">{authorMeta}</div>
                      )}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Mission */}
      <section
        id="mission"
        className="border-t border-ink-600 bg-ink-800/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
                Mission
              </p>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
                Build the network your business deserves.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-300">
                RFR Network exists to replace cold outreach with warm trust. Every member
                is vetted. Every chapter holds one seat per business category. Every
                referral is tracked end-to-end — so your generosity compounds into real
                revenue.
              </p>
            </div>
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-gold">
                Vision
              </p>
              <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
                The world's most trusted referral network.
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-300">
                We are building a global community of operators who move business by
                moving people toward each other. Chapters in every major market. Members
                who close. Relationships that outlast the pitch deck.
              </p>
            </div>
          </div>

          <div className="mt-16 grid gap-6 sm:grid-cols-3">
            <div className="card">
              <div className="mb-2 text-2xl font-bold text-gold">One seat per category</div>
              <p className="text-sm text-gray-300">
                No internal competition. You are the only person in your chapter who does
                what you do.
              </p>
            </div>
            <div className="card">
              <div className="mb-2 text-2xl font-bold text-gold">Weekly rhythm</div>
              <p className="text-sm text-gray-300">
                Chapters meet weekly. You get a recurring stage to showcase what you do
                and to pass referrals you trust.
              </p>
            </div>
            <div className="card">
              <div className="mb-2 text-2xl font-bold text-gold">Closed-loop tracking</div>
              <p className="text-sm text-gray-300">
                Every referral is tracked from introduction to close. Members who deliver
                get seen. Members who receive get accountable.
              </p>
            </div>
          </div>

          <div className="mt-16 text-center">
            <Link href="/signup" className="btn-gold">
              Apply to join
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-ink-600 py-10 text-center text-sm text-gray-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p>
            &copy; {new Date().getFullYear()} RFR Network. Connection is currency.
          </p>
        </div>
      </footer>
    </>
  );
}
