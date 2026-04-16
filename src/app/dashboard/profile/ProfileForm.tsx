'use client';

import { useState, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { updateProfile, uploadAvatar } from './actions';

export default function ProfileForm({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [uploadPending, startUpload] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const r = await updateProfile(formData);
      if (r?.error) setError(r.error);
      else {
        setSuccess('Profile saved.');
        router.refresh();
      }
    });
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set('avatar', file);
    setError(null);
    setSuccess(null);
    startUpload(async () => {
      const r = await uploadAvatar(fd);
      if (r?.error) setError(r.error);
      else if (r?.url) {
        setAvatarUrl(`${r.url}?t=${Date.now()}`);
        setSuccess('Avatar updated.');
        router.refresh();
      }
      if (fileRef.current) fileRef.current.value = '';
    });
  }

  const initials =
    [profile.first_name, profile.last_name]
      .filter(Boolean)
      .map((s) => s!.charAt(0).toUpperCase())
      .join('') || profile.email.charAt(0).toUpperCase();

  return (
    <div className="space-y-8">
      <section className="card">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="relative">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${profile.first_name ?? profile.email}'s avatar`}
                className="h-20 w-20 rounded-full border border-gold/40 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-gold to-gold-700 text-2xl font-bold text-ink-900">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="font-serif text-xl font-bold text-white">
              {[profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email}
            </div>
            <div className="text-sm text-gray-400">{profile.email}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <label className="btn-outline cursor-pointer">
                {uploadPending ? 'Uploading…' : 'Upload avatar'}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadPending}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500">JPG or PNG, max 5MB.</p>
          </div>
        </div>
      </section>

      <form action={handleSubmit} className="card space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="first_name">First name</label>
            <input
              id="first_name"
              name="first_name"
              className="input"
              defaultValue={profile.first_name ?? ''}
            />
          </div>
          <div>
            <label className="label" htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              name="last_name"
              className="input"
              defaultValue={profile.last_name ?? ''}
            />
          </div>
          <div>
            <label className="label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              name="phone"
              className="input"
              defaultValue={profile.phone ?? ''}
              placeholder="(555) 555-5555"
            />
          </div>
          <div>
            <label className="label" htmlFor="company_name">Company</label>
            <input
              id="company_name"
              name="company_name"
              className="input"
              defaultValue={profile.company_name ?? ''}
            />
          </div>
          <div>
            <label className="label" htmlFor="business_category">Business category</label>
            <input
              id="business_category"
              name="business_category"
              className="input"
              defaultValue={profile.business_category ?? ''}
              placeholder="e.g. Commercial insurance"
            />
          </div>
          <div>
            <label className="label" htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="url"
              className="input"
              defaultValue={profile.website ?? ''}
              placeholder="https://example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="linkedin_url">LinkedIn URL</label>
            <input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              className="input"
              defaultValue={profile.linkedin_url ?? ''}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          <div>
            <label className="label" htmlFor="city">City</label>
            <input
              id="city"
              name="city"
              className="input"
              defaultValue={profile.city ?? ''}
            />
          </div>
          <div>
            <label className="label" htmlFor="state">State</label>
            <input
              id="state"
              name="state"
              className="input"
              defaultValue={profile.state ?? ''}
              placeholder="FL"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              rows={4}
              className="input"
              defaultValue={profile.bio ?? ''}
              placeholder="A few sentences about you and what you do…"
            />
          </div>
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

        <div className="flex justify-end">
          <button type="submit" disabled={pending} className="btn-gold">
            {pending ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
