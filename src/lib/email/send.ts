import * as React from 'react';
import { resend, DEFAULT_FROM } from './client';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
  replyTo?: string;
}

/**
 * Send an email via Resend. Swallows errors so email failures never break
 * the calling server action (email is non-critical side effect).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!resend) {
    console.warn('[rfr-email] RFR_RESEND_API_KEY not configured — skipping email');
    return { ok: false, error: 'no_api_key' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: opts.from || DEFAULT_FROM,
      to: opts.to,
      subject: opts.subject,
      react: opts.react,
      ...(opts.replyTo ? { replyTo: opts.replyTo } : {}),
    });

    if (error) {
      console.error('[rfr-email] Send error:', error.message);
      return { ok: false, error: error.message };
    }

    return { ok: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[rfr-email] Exception:', message);
    return { ok: false, error: message };
  }
}
