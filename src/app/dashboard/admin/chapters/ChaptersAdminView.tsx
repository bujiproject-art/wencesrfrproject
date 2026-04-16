'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { Chapter, Profile } from '@/lib/types';
import { createChapter, reassignChapterAdmin } from './actions';

type ChapterWithAdmin = Chapter & {
  admin_profile?: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'> | null;
};

export default function ChaptersAdminView({
  chapters,
  allProfiles,
}: {
  chapters: ChapterWithAdmin[];
  allProfiles: Pick<Profile, 'id' | 'first_name' | 'last_name' | 'email'>[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [reassignFor, setReassignFor] = useState<string | null>(null);
  const [reassignTo, setReassignTo] = useState<string>('');

  function handleCreate(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await createChapter(formData);
      if (r?.error) setError(r.error);
      else {
        setSuccess(`Created "${formData.get('name')}" — slug: ${r?.slug}`);
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handleReassign(chapterId: string) {
    if (!reassignTo) {
      setError('Select a profile first.');
      return;
    }
    setError(null);
    setSuccess(null);
    const fd = new FormData();
    fd.set('chapter_id', chapterId);
    fd.set('profile_id', reassignTo);
    startTransition(async () => {
      const r = await reassignChapterAdmin(fd);
      if (r?.error) setError(r.error);
      else {
        setSuccess('Chapter admin reassigned.');
        setReassignFor(null);
        setReassignTo('');
        router.refresh();
      }
    });
  }

  function profileLabel(
    p: Pick<Profile, 'first_name' | 'last_name' | 'email'> | null | undefined,
  ): string {
    if (!p) return '—';
    return [p.first_name, p.last_name].filter(Boolean).join(' ').trim() || p.email;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold text-white">All chapters</h1>
          <p className="mt-1 text-sm text-gray-400">
            Super-admin view: create and manage every chapter in the network.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="btn-gold"
        >
          {showForm ? 'Cancel' : '+ Create new chapter'}
        </button>
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

      {showForm && (
        <form action={handleCreate} className="card grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="name">Name *</label>
            <input
              id="name"
              name="name"
              className="input"
              required
              placeholder="RFR Network - Atlanta"
              onInput={(e) => {
                const slugField = document.getElementById('slug') as HTMLInputElement | null;
                if (slugField && !slugField.dataset.touched) {
                  slugField.value = (e.target as HTMLInputElement).value
                    .toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-');
                }
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="slug">Slug (auto-generated, editable)</label>
            <input
              id="slug"
              name="slug"
              className="input"
              placeholder="rfr-network-atlanta"
              onInput={(e) => {
                (e.target as HTMLInputElement).dataset.touched = 'true';
              }}
            />
          </div>
          <div>
            <label className="label" htmlFor="city">City *</label>
            <input id="city" name="city" className="input" required />
          </div>
          <div>
            <label className="label" htmlFor="state">State *</label>
            <input id="state" name="state" className="input" required maxLength={2} placeholder="GA" />
          </div>
          <div>
            <label className="label" htmlFor="zip_code">ZIP code</label>
            <input id="zip_code" name="zip_code" className="input" />
          </div>
          <div>
            <label className="label" htmlFor="max_members">Max members</label>
            <input
              id="max_members"
              name="max_members"
              type="number"
              min="10"
              max="200"
              defaultValue={50}
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="meeting_day">Meeting day</label>
            <select id="meeting_day" name="meeting_day" className="input" defaultValue="">
              <option value="">—</option>
              <option>Monday</option>
              <option>Tuesday</option>
              <option>Wednesday</option>
              <option>Thursday</option>
              <option>Friday</option>
              <option>Saturday</option>
              <option>Sunday</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="meeting_time">Meeting time</label>
            <input id="meeting_time" name="meeting_time" type="time" className="input" defaultValue="07:30" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="meeting_location">Meeting location</label>
            <input id="meeting_location" name="meeting_location" className="input" placeholder="123 Main St, Suite 200" />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="description">Description</label>
            <textarea id="description" name="description" rows={3} className="input" placeholder="Short description shown on the chapter finder." />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setShowForm(false)}
              disabled={pending}
            >
              Cancel
            </button>
            <button type="submit" className="btn-gold" disabled={pending}>
              {pending ? 'Creating…' : 'Create chapter'}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-hidden rounded-lg border border-ink-500 bg-ink-800">
        <div className="hidden sm:grid grid-cols-[2fr_1fr_1.5fr_0.7fr_1.5fr] gap-3 bg-ink-700 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gold">
          <div>Chapter</div>
          <div>Location</div>
          <div>Current admin</div>
          <div>Members</div>
          <div>Actions</div>
        </div>
        <ul className="divide-y divide-ink-600">
          {chapters.map((c) => (
            <li key={c.id} className="px-4 py-3 text-sm sm:grid sm:grid-cols-[2fr_1fr_1.5fr_0.7fr_1.5fr] sm:items-center sm:gap-3">
              <div>
                <div className="font-medium text-white">{c.name}</div>
                <div className="text-xs text-gray-500">/{c.slug}</div>
              </div>
              <div className="text-gray-300 text-xs sm:text-sm">
                {c.city}, {c.state}
              </div>
              <div className="text-gray-300 text-xs sm:text-sm">
                {profileLabel(c.admin_profile)}
              </div>
              <div className="text-gray-300 text-xs sm:text-sm">
                {c.member_count ?? 0} / {c.max_members ?? 50}
              </div>
              <div className="mt-2 sm:mt-0">
                {reassignFor === c.id ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="input !w-auto !py-1 text-xs"
                      value={reassignTo}
                      onChange={(e) => setReassignTo(e.target.value)}
                    >
                      <option value="">— select —</option>
                      {allProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {profileLabel(p)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-gold px-3 py-1 text-xs"
                      disabled={pending}
                      onClick={() => handleReassign(c.id)}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      className="btn-ghost px-2 py-1 text-xs"
                      onClick={() => {
                        setReassignFor(null);
                        setReassignTo('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="btn-outline px-3 py-1 text-xs"
                    onClick={() => {
                      setReassignFor(c.id);
                      setReassignTo(c.chapter_admin_id ?? '');
                    }}
                  >
                    Reassign admin
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
