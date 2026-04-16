'use client';

import { useState, useTransition } from 'react';
import { signupAction } from './actions';

type ChapterOption = { slug: string; name: string; city: string; state: string };

export default function SignupForm({
  defaultChapterSlug,
  defaultEmail = '',
  inviteToken = '',
  chapters,
}: {
  defaultChapterSlug: string;
  defaultEmail?: string;
  inviteToken?: string;
  chapters: ChapterOption[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await signupAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={onSubmit} className="card space-y-4">
      {inviteToken ? <input type="hidden" name="invite_token" value={inviteToken} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="first_name">
            First name *
          </label>
          <input id="first_name" name="first_name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="last_name">
            Last name *
          </label>
          <input id="last_name" name="last_name" required className="input" />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="email">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
          readOnly={!!defaultEmail}
          required
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="password">
          Password * (min 8 characters)
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="company_name">
          Company
        </label>
        <input id="company_name" name="company_name" className="input" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="city">
            City
          </label>
          <input id="city" name="city" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="state">
            State
          </label>
          <input id="state" name="state" className="input" placeholder="FL" maxLength={2} />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="chapter_slug">
          Chapter (optional)
        </label>
        <select
          id="chapter_slug"
          name="chapter_slug"
          defaultValue={defaultChapterSlug}
          className="input"
        >
          <option value="">No chapter yet</option>
          {chapters.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name} — {c.city}, {c.state}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <button type="submit" disabled={pending} className="btn-gold w-full">
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  );
}
