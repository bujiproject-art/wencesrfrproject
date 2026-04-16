'use server';

import * as React from 'react';
import { requireUser } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/send';
import { ChapterInvite } from '@/lib/email/templates/ChapterInvite';

interface RowResult {
  row: number;
  email: string;
  status: 'created' | 'existing' | 'error';
  message?: string;
}

interface ImportResult {
  success: boolean;
  error?: string;
  processed: number;
  created: number;
  existing: number;
  errors: number;
  rows: RowResult[];
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const out: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) { out.push(current); current = ''; }
      else current += ch;
    }
    out.push(current);
    return out.map((s) => s.trim());
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim(); });
    rows.push(row);
  }
  return rows;
}

export async function importMembersCsv(formData: FormData): Promise<ImportResult> {
  const ctx = await requireUser();
  if (!ctx.isSuperAdmin) {
    return { success: false, error: 'Only super_admin can import members.', processed: 0, created: 0, existing: 0, errors: 0, rows: [] };
  }

  const file = formData.get('csv') as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: 'No file uploaded.', processed: 0, created: 0, existing: 0, errors: 0, rows: [] };
  }
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: 'File too large (max 2MB).', processed: 0, created: 0, existing: 0, errors: 0, rows: [] };
  }

  const text = await file.text();
  const rows = parseCsv(text);

  if (rows.length === 0) {
    return { success: false, error: 'CSV has no data rows.', processed: 0, created: 0, existing: 0, errors: 0, rows: [] };
  }
  if (rows.length > 500) {
    return { success: false, error: 'Too many rows (max 500 per import).', processed: 0, created: 0, existing: 0, errors: 0, rows: [] };
  }

  const admin = createServiceRoleClient();

  const slugs = Array.from(new Set(rows.map((r) => r.chapter_slug).filter(Boolean)));
  const { data: chapters } = await admin
    .from('chapters')
    .select('id, slug, name')
    .in('slug', slugs);
  const chapterBySlug = new Map((chapters || []).map((c) => [c.slug, c]));

  const results: RowResult[] = [];
  let created = 0;
  let existing = 0;
  let errors = 0;

  const inviterName = [ctx.profile.first_name, ctx.profile.last_name].filter(Boolean).join(' ') || 'RFR Network Admin';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2;
    const email = (row.email || '').toLowerCase();

    if (!email || !email.includes('@')) {
      errors++;
      results.push({ row: rowNum, email: email || '(empty)', status: 'error', message: 'Missing or invalid email' });
      continue;
    }
    if (!row.chapter_slug) {
      errors++;
      results.push({ row: rowNum, email, status: 'error', message: 'Missing chapter_slug' });
      continue;
    }

    const chapter = chapterBySlug.get(row.chapter_slug);
    if (!chapter) {
      errors++;
      results.push({ row: rowNum, email, status: 'error', message: `Chapter not found: ${row.chapter_slug}` });
      continue;
    }

    let profileId: string;
    let wasCreated = false;

    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existingProfile) {
      profileId = existingProfile.id;
    } else {
      const { data: inserted, error: insertError } = await admin
        .from('profiles')
        .insert({
          email,
          first_name: row.first_name || null,
          last_name: row.last_name || null,
          phone: row.phone || null,
          company_name: row.company_name || null,
          business_category: row.business_category || null,
          global_role: 'member',
        })
        .select('id')
        .single();

      if (insertError || !inserted) {
        errors++;
        results.push({ row: rowNum, email, status: 'error', message: insertError?.message || 'Profile insert failed' });
        continue;
      }
      profileId = inserted.id;
      wasCreated = true;
    }

    const { data: existingMembership } = await admin
      .from('chapter_memberships')
      .select('id, status')
      .eq('chapter_id', chapter.id)
      .eq('profile_id', profileId)
      .maybeSingle();

    if (!existingMembership) {
      await admin.from('chapter_memberships').insert({
        chapter_id: chapter.id,
        profile_id: profileId,
        chapter_role: 'member',
        status: 'pending',
      });
    }

    const { data: invitation } = await admin
      .from('invitations')
      .insert({
        chapter_id: chapter.id,
        invited_by_profile_id: ctx.profile.id,
        invitee_email: email,
        invitee_name: [row.first_name, row.last_name].filter(Boolean).join(' ') || null,
        status: 'pending',
      })
      .select('invitation_token, expires_at')
      .single();

    if (invitation?.invitation_token) {
      await sendEmail({
        to: email,
        subject: `${inviterName} invited you to join ${chapter.name} on RFR Network`,
        react: React.createElement(ChapterInvite, {
          recipientName: row.first_name || null,
          inviterName,
          chapterName: chapter.name,
          inviteToken: invitation.invitation_token,
          expiresAt: invitation.expires_at
            ? new Date(invitation.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            : null,
        }),
      });
    }

    if (wasCreated) {
      created++;
      results.push({ row: rowNum, email, status: 'created' });
    } else {
      existing++;
      results.push({ row: rowNum, email, status: 'existing', message: 'Profile already existed; invite sent' });
    }
  }

  return { success: true, processed: rows.length, created, existing, errors, rows: results };
}
