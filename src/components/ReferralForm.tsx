'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { submitReferral } from '@/app/dashboard/referrals/new/actions';

type Member = {
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_name: string | null;
};

export default function ReferralForm({
  chapterId,
  members,
}: {
  chapterId: string;
  members: Member[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await submitReferral(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        router.push('/dashboard/referrals');
        router.refresh();
      }
    });
  }

  return (
    <form action={onSubmit} className="card space-y-5">
      <input type="hidden" name="chapter_id" value={chapterId} />

      <div>
        <label className="label" htmlFor="to_profile_id">
          Refer to
        </label>
        <select
          name="to_profile_id"
          id="to_profile_id"
          required
          className="input"
          defaultValue=""
        >
          <option value="" disabled>
            Select a chapter member…
          </option>
          {members.map((m) => {
            const n = [m.first_name, m.last_name].filter(Boolean).join(' ').trim() || m.email;
            return (
              <option key={m.profile_id} value={m.profile_id}>
                {n}
                {m.company_name ? ` — ${m.company_name}` : ''}
              </option>
            );
          })}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="referred_name">
            Prospect name *
          </label>
          <input
            name="referred_name"
            id="referred_name"
            required
            className="input"
            placeholder="Jane Smith"
          />
        </div>
        <div>
          <label className="label" htmlFor="referred_company">
            Prospect company
          </label>
          <input
            name="referred_company"
            id="referred_company"
            className="input"
            placeholder="Acme Co."
          />
        </div>
        <div>
          <label className="label" htmlFor="referred_email">
            Prospect email
          </label>
          <input
            type="email"
            name="referred_email"
            id="referred_email"
            className="input"
            placeholder="jane@acme.com"
          />
        </div>
        <div>
          <label className="label" htmlFor="referred_phone">
            Prospect phone
          </label>
          <input
            name="referred_phone"
            id="referred_phone"
            className="input"
            placeholder="(555) 555-5555"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="service_needed">
          Service needed
        </label>
        <input
          name="service_needed"
          id="service_needed"
          className="input"
          placeholder="Commercial insurance"
        />
      </div>

      <div>
        <label className="label" htmlFor="estimated_value">
          Estimated deal value (USD)
        </label>
        <input
          name="estimated_value"
          id="estimated_value"
          type="number"
          min="0"
          step="1"
          className="input"
          placeholder="0"
        />
      </div>

      <div>
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <textarea
          name="notes"
          id="notes"
          rows={4}
          className="input"
          placeholder="Context for the referral — how you know the prospect, warm intro details, etc."
        />
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button type="submit" disabled={pending} className="btn-gold">
          {pending ? 'Submitting…' : 'Submit referral'}
        </button>
      </div>
    </form>
  );
}
