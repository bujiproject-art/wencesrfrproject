import * as React from 'react';
import { Layout, Heading, P, Button, Muted } from './Layout';
import { APP_URL } from '../client';

interface ReferralReceivedProps {
  recipientFirstName: string;
  senderName: string;
  prospectName: string;
  prospectCompany?: string | null;
  serviceNeeded?: string | null;
  estimatedValue?: string | null;
  notes?: string | null;
}

export function ReferralReceived({
  recipientFirstName,
  senderName,
  prospectName,
  prospectCompany,
  serviceNeeded,
  estimatedValue,
  notes,
}: ReferralReceivedProps) {
  return (
    <Layout preview={`${senderName} sent you a referral: ${prospectName}`}>
      <Heading>You received a new referral</Heading>
      <P>Hi {recipientFirstName},</P>
      <P>
        <strong>{senderName}</strong> just sent you a referral through RFR Network. Here are the details:
      </P>

      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelStyle}>Prospect</td>
            <td style={valueStyle}>{prospectName}</td>
          </tr>
          {prospectCompany ? (
            <tr>
              <td style={labelStyle}>Company</td>
              <td style={valueStyle}>{prospectCompany}</td>
            </tr>
          ) : null}
          {serviceNeeded ? (
            <tr>
              <td style={labelStyle}>Service Needed</td>
              <td style={valueStyle}>{serviceNeeded}</td>
            </tr>
          ) : null}
          {estimatedValue ? (
            <tr>
              <td style={labelStyle}>Estimated Value</td>
              <td style={valueStyle}>{estimatedValue}</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {notes ? (
        <>
          <P>
            <strong>Notes from {senderName}:</strong>
          </P>
          <P>{notes}</P>
        </>
      ) : null}

      <Button href={`${APP_URL}/dashboard/referrals`}>View Referral</Button>

      <Muted>
        Reply promptly — the strength of a referral network depends on follow-through. Update the status as you contact
        the prospect, set meetings, and close deals.
      </Muted>
    </Layout>
  );
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  margin: '16px 0',
  backgroundColor: '#0A0A0A',
  borderRadius: 8,
};

const labelStyle: React.CSSProperties = {
  color: '#888',
  fontSize: 12,
  padding: '10px 16px',
  textTransform: 'uppercase',
  letterSpacing: 1,
  borderBottom: '1px solid #2a2a2a',
  width: 140,
};

const valueStyle: React.CSSProperties = {
  color: '#e8e8e8',
  fontSize: 14,
  fontWeight: 600,
  padding: '10px 16px',
  borderBottom: '1px solid #2a2a2a',
};
