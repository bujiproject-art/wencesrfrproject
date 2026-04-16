'use client';

import { useState } from 'react';
import { importMembersCsv } from './actions';

interface RowResult { row: number; email: string; status: 'created' | 'existing' | 'error'; message?: string; }
interface Result { success: boolean; error?: string; processed: number; created: number; existing: number; errors: number; rows: RowResult[]; }

export default function ImportConsole() {
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setResult(null);
    const r = await importMembersCsv(formData);
    setResult(r);
    setSubmitting(false);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Bulk Member Import</h1>
        <p className="text-gray-400 mt-1">Upload a CSV of members to create profiles and send chapter invitations.</p>
      </div>

      <section className="rounded-lg border border-gray-800 bg-black/40 p-6">
        <h2 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-3">CSV Format</h2>
        <p className="text-sm text-gray-400 mb-3">Required columns (case-insensitive, exact names):</p>
        <pre className="bg-black border border-gray-800 rounded-md p-3 text-xs text-gray-300 overflow-x-auto">
{`chapter_slug,first_name,last_name,email,phone,company_name,business_category
miami-alpha,Jane,Smith,jane@example.com,305-555-0100,Smith Legal,Lawyer
houston,John,Doe,john@example.com,713-555-0100,Doe Accounting,CPA`}
        </pre>
        <ul className="mt-4 text-xs text-gray-500 space-y-1">
          <li>• Chapter slugs must match existing chapters</li>
          <li>• Email is required; all other fields are optional</li>
          <li>• Max 500 rows per upload, 2MB max file size</li>
          <li>• Each member receives an invitation email with a 30-day redemption link</li>
        </ul>
      </section>

      <section className="rounded-lg border border-gray-800 bg-black/40 p-6">
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5 uppercase tracking-wide">CSV File</label>
            <input type="file" name="csv" accept=".csv,text/csv" required className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#D4AF37] file:text-black file:font-semibold file:cursor-pointer hover:file:bg-[#C4A030]" />
          </div>

          <button type="submit" disabled={submitting} className="bg-[#D4AF37] text-black font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-[#C4A030] disabled:opacity-50">
            {submitting ? 'Importing…' : 'Import Members'}
          </button>
        </form>
      </section>

      {result && (
        <section className="rounded-lg border border-gray-800 bg-black/40 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Import Result</h2>
          {result.error ? (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 text-sm">{result.error}</div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="rounded-lg border border-gray-800 p-3">
                  <div className="text-xs text-gray-500 uppercase">Processed</div>
                  <div className="text-2xl font-bold text-white">{result.processed}</div>
                </div>
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <div className="text-xs text-emerald-400 uppercase">Created</div>
                  <div className="text-2xl font-bold text-emerald-400">{result.created}</div>
                </div>
                <div className="rounded-lg border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                  <div className="text-xs text-[#D4AF37] uppercase">Existing</div>
                  <div className="text-2xl font-bold text-[#D4AF37]">{result.existing}</div>
                </div>
                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <div className="text-xs text-red-400 uppercase">Errors</div>
                  <div className="text-2xl font-bold text-red-400">{result.errors}</div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-black/60 text-xs text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-3 py-2">Row</th>
                      <th className="text-left px-3 py-2">Email</th>
                      <th className="text-left px-3 py-2">Status</th>
                      <th className="text-left px-3 py-2">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((r, idx) => (
                      <tr key={idx} className="border-t border-gray-800">
                        <td className="px-3 py-2 text-gray-500">{r.row}</td>
                        <td className="px-3 py-2 text-gray-300">{r.email}</td>
                        <td className="px-3 py-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${statusColor(r.status)}`}>{r.status}</span>
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{r.message || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}

function statusColor(s: string): string {
  if (s === 'created') return 'bg-emerald-500/10 text-emerald-400';
  if (s === 'existing') return 'bg-[#D4AF37]/10 text-[#D4AF37]';
  return 'bg-red-500/10 text-red-400';
}
