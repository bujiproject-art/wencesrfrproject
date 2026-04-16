'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Referral, ReferralStatus } from '@/lib/types';
import { REFERRAL_STATUS_LABELS } from '@/lib/types';
import { updateReferralStatus, updateReferralNotes } from './actions';

type PartyInfo = {
  first_name: string | null;
  last_name: string | null;
  email: string;
  company_name: string | null;
} | null;

const RECIPIENT_STATUSES: ReferralStatus[] = [
  'submitted',
  'contacted',
  'meeting_set',
  'in_progress',
  'closed_won',
  'closed_lost',
  'declined',
];

function partyName(p: PartyInfo): string {
  if (!p) return '—';
  const n = [p.first_name, p.last_name].filter(Boolean).join(' ').trim();
  return n || p.email;
}

export default function ReferralDetailView({
  referral,
  fromProfile,
  toProfile,
  isRecipient,
  isGiver,
}: {
  referral: Referral;
  fromProfile: PartyInfo;
  toProfile: PartyInfo;
  isRecipient: boolean;
  isGiver: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<ReferralStatus>(referral.status);
  const [actualValue, setActualValue] = useState<string>(
    referral.actual_value_cents ? String(referral.actual_value_cents / 100) : '',
  );
  const [notes, setNotes] = useState(referral.notes ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canEdit = isRecipient || isGiver;
  const needsActualValue = status === 'closed_won';

  function handleStatusSave() {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set('referral_id', referral.id);
    fd.set('status', status);
    if (status === 'closed_won') fd.set('actual_value', actualValue);
    startTransition(async () => {
      const r = await updateReferralStatus(fd);
      if (r?.error) setError(r.error);
      else {
        setSuccess('Status updated.');
        router.refresh();
      }
    });
  }

  function handleNotesSave() {
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set('referral_id', referral.id);
    fd.set('notes', notes);
    startTransition(async () => {
      const r = await updateReferralNotes(fd);
      if (r?.error) setError(r.error);
      else setSuccess('Notes saved.');
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold">Referral</p>
        <h1 className="font-serif text-3xl font-bold text-white">
          {referral.referred_name}
        </h1>
        {referral.referred_company && (
          <p className="text-sm text-gray-400">{referral.referred_company}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-gold">Referred by</div>
          <div className="mt-1 text-white">{partyName(fromProfile)}</div>
          {fromProfile?.email && (
            <div className="text-xs text-gray-400">{fromProfile.email}</div>
          )}
        </div>
        <div className="card">
          <div className="text-xs uppercase tracking-wider text-gold">Referred to</div>
          <div className="mt-1 text-white">{partyName(toProfile)}</div>
          {toProfile?.email && (
            <div className="text-xs text-gray-400">{toProfile.email}</div>
          )}
        </div>
      </div>

      <div className="card space-y-2">
        <div className="text-xs uppercase tracking-wider text-gold">Prospect details</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {referral.referred_email && (
            <div>
              <div className="text-xs text-gray-500">Email</div>
              <div className="text-sm text-white">{referral.referred_email}</div>
            </div>
          )}
          {referral.referred_phone && (
            <div>
              <div className="text-xs text-gray-500">Phone</div>
              <div className="text-sm text-white">{referral.referred_phone}</div>
            </div>
          )}
          {referral.service_needed && (
            <div>
              <div className="text-xs text-gray-500">Service needed</div>
              <div className="text-sm text-white">{referral.service_needed}</div>
            </div>
          )}
          {referral.estimated_value_cents != null && (
            <div>
              <div className="text-xs text-gray-500">Estimated value</div>
              <div className="text-sm text-white">
                ${(referral.estimated_value_cents / 100).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      </div>

      {canEdit && (
        <div className="card space-y-4">
          <div className="text-xs uppercase tracking-wider text-gold">Pipeline status</div>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div>
              <label className="label" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value as ReferralStatus)}
                disabled={pending}
              >
                {RECIPIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {REFERRAL_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
            {needsActualValue && (
              <div>
                <label className="label" htmlFor="actual_value">
                  Actual deal value (USD) *
                </label>
                <input
                  id="actual_value"
                  type="number"
                  min="0"
                  step="1"
                  className="input"
                  value={actualValue}
                  onChange={(e) => setActualValue(e.target.value)}
                  disabled={pending}
                  placeholder="0"
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <button
                type="button"
                className="btn-gold"
                onClick={handleStatusSave}
                disabled={pending}
              >
                {pending ? 'Saving…' : 'Save status'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="text-xs uppercase tracking-wider text-gold">Notes</div>
        {canEdit ? (
          <>
            <textarea
              className="input"
              rows={5}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={pending}
              placeholder="Notes, context, follow-ups…"
            />
            <div>
              <button
                type="button"
                className="btn-outline"
                onClick={handleNotesSave}
                disabled={pending}
              >
                {pending ? 'Saving…' : 'Save notes'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-300 whitespace-pre-wrap">
            {referral.notes || '—'}
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-300">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {success}
        </div>
      )}

      <div className="text-xs text-gray-500">
        Created {new Date(referral.created_at).toLocaleString()}
        {referral.closed_at && ` · Closed ${new Date(referral.closed_at).toLocaleDateString()}`}
      </div>
    </div>
  );
}
