'use client';

import { useState } from 'react';
import { createInvitation, revokeInvitation } from './actions';

interface Chapter { id: string; name: string; slug: string; }
interface Invitation {
  id: string;
  chapter_id: string;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
}
interface Props { chapters: Chapter[]; invitations: Invitation[]; isSuperAdmin: boolean; }

export default function InvitesConsole({ chapters, invitations }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const chapterById = new Map(chapters.map((c) => [c.id, c]));

  async function handleCreate(formData: FormData) {
    setSubmitting(true);
    setMessage(null);
    const result = await createInvitation(formData);
    if (result.error) {
      setMessage({ type: 'error', text: result.error });
    } else {
      setMessage({ type: 'success', text: 'Invitation sent.' });
    }
    setSubmitting(false);
  }

  async function handleRevoke(invitationId: string) {
    if (!confirm('Revoke this invitation? The recipient will no longer be able to use it.')) return;
    const fd = new FormData();
    fd.set('invitation_id', invitationId);
    const result = await revokeInvitation(fd);
    if (result.error) setMessage({ type: 'error', text: result.error });
    else setMessage({ type: 'success', text: 'Invitation revoked.' });
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Chapter Invitations</h1>
        <p className="text-gray-400 mt-1">Invite new members to your chapters. Invitations expire after 30 days.</p>
      </div>

      {chapters.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-black/40 p-6 text-center">
          <p className="text-gray-400">You don&rsquo;t have any chapters to invite members to.</p>
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-gray-800 bg-black/40 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Send New Invitation</h2>
            <form action={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Chapter</label>
                <select name="chapter_id" required className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#D4AF37]/50 focus:outline-none">
                  {chapters.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Invitee Name</label>
                  <input type="text" name="invitee_name" placeholder="Optional" className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">Email *</label>
                  <input type="email" name="invitee_email" required className="w-full bg-black border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#D4AF37]/50 focus:outline-none" />
                </div>
              </div>

              {message && (
                <div className={`text-sm px-3 py-2 rounded-lg ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                  {message.text}
                </div>
              )}

              <button type="submit" disabled={submitting} className="bg-[#D4AF37] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#C4A030] disabled:opacity-50 transition-colors">
                {submitting ? 'Sending…' : 'Send Invitation'}
              </button>
            </form>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-4">Invitations ({invitations.length})</h2>
            {invitations.length === 0 ? (
              <div className="rounded-lg border border-gray-800 bg-black/40 p-6 text-center">
                <p className="text-gray-400">No invitations yet.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-800 bg-black/40 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/60 text-xs text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-4 py-3">Invitee</th>
                      <th className="text-left px-4 py-3">Chapter</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Sent</th>
                      <th className="text-right px-4 py-3">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((inv) => (
                      <tr key={inv.id} className="border-t border-gray-800">
                        <td className="px-4 py-3">
                          <div className="text-white">{inv.invitee_name || '—'}</div>
                          <div className="text-gray-500 text-xs">{inv.invitee_email}</div>
                        </td>
                        <td className="px-4 py-3 text-gray-300">{chapterById.get(inv.chapter_id)?.name || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor(inv.status)}`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-right">
                          {inv.status === 'pending' ? (
                            <button onClick={() => handleRevoke(inv.id)} className="text-xs text-red-400 hover:text-red-300">Revoke</button>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function statusColor(status: string): string {
  if (status === 'pending') return 'bg-[#D4AF37]/10 text-[#D4AF37]';
  if (status === 'accepted') return 'bg-emerald-500/10 text-emerald-400';
  if (status === 'revoked') return 'bg-red-500/10 text-red-400';
  if (status === 'expired') return 'bg-gray-500/10 text-gray-400';
  return 'bg-gray-500/10 text-gray-400';
}
