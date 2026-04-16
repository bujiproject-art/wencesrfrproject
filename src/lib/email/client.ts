import { Resend } from 'resend';

// RFR Network uses its own Resend API key, separate from Agent Midas.
// Env var: RFR_RESEND_API_KEY
const apiKey = process.env.RFR_RESEND_API_KEY;

export const resend = apiKey ? new Resend(apiKey) : null;

/**
 * Default from address for RFR Network emails.
 * Falls back to noreply@agentmidas.xyz until rfr.network domain is verified.
 */
export const DEFAULT_FROM = process.env.RFR_EMAIL_FROM || 'RFR Network <noreply@agentmidas.xyz>';

/**
 * Base URL for links in emails. Defaults to production domain.
 */
export const APP_URL = process.env.RFR_APP_URL || 'https://rfr-network.agentmidas.xyz';
