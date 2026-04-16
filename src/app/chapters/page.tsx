import Navbar from '@/components/Navbar';
import ChapterCard from '@/components/ChapterCard';
import { createClient } from '@/lib/supabase/server';
import type { Chapter } from '@/lib/types';

export const revalidate = 60;

export default async function ChaptersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; state?: string }>;
}) {
  const { q, state } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from('chapters')
    .select('*')
    .eq('status', 'active')
    .order('state', { ascending: true })
    .order('city', { ascending: true });

  if (q && q.trim()) {
    const pattern = `%${q.trim()}%`;
    query = query.or(`city.ilike.${pattern},name.ilike.${pattern}`);
  }
  if (state && state.trim()) {
    query = query.ilike('state', state.trim());
  }

  const { data: chapters } = await query;

  const states = Array.from(
    new Set((chapters ?? []).map((c) => c.state)),
  ).sort();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-bold text-white sm:text-5xl">
            All chapters
          </h1>
          <p className="mt-2 text-gray-400">
            {chapters?.length ?? 0} active chapter{chapters?.length === 1 ? '' : 's'}.
          </p>
        </div>

        <form className="mb-8 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
          <input
            type="text"
            name="q"
            defaultValue={q ?? ''}
            placeholder="Search by city or name…"
            className="input"
          />
          <select name="state" defaultValue={state ?? ''} className="input">
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button type="submit" className="btn-gold whitespace-nowrap">
            Filter
          </button>
        </form>

        {chapters && chapters.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c) => (
              <ChapterCard key={c.id} chapter={c as Chapter} />
            ))}
          </div>
        ) : (
          <div className="card text-center text-gray-400">
            No chapters match your filters.
          </div>
        )}
      </main>
    </>
  );
}
