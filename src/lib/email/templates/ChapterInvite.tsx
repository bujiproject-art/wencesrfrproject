import * as React from 'react';
import { Layout, Heading, P, Button, Muted } from './Layout';
import { APP_URL } from '../client';

interface ChapterInviteProps {
  recipientName?: string | null;
  inviterName: string;
  chapterName: string;
  inviteToken: string;
  expiresAt?: string | null;
}

export function ChapterInvite({
  recipientName,
  inviterName,
  chapterName,
  inviteToken,
  expiresAt,
}: ChapterInviteProps) {
  const inviteUrl = `${APP_URL}/invite/${inviteToken}`;

  return (
    <Layout preview={`You're invited to join ${chapterName} on RFR Network`}>
      <Heading>You&rsquo;re invited to join {chapterName}</Heading>
      <P>Hi{recipientName ? ` ${recipientName}` : ''},</P>
      <P>
        <strong>{inviterName}</strong> invited you to join <strong>{chapterName}</strong> on RFR Network — a private
        referral platform for trusted business professionals.
      </P>

      <P>What to expect:</P>
      <P style={{ paddingLeft: 16 }}>
        · Weekly chapter meetings to exchange qualified referrals<br />
        · A member directory to find and be found<br />
        · Tools to track the deals you send and receive
      </P>

      <Button href={inviteUrl}>Accept Invitation</Button>

      <P style={{ fontSize: 12, color: '#888', wordBreak: 'break-all' }}>
        Or paste this link into your browser:<br />
        {inviteUrl}
      </P>

      <Muted>
        This invitation {expiresAt ? `expires on ${expiresAt}` : 'expires in 30 days'}. Questions? Reply to this email.
      </Muted>
    </Layout>
  );
}
