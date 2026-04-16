import * as React from 'react';
import { Layout, Heading, P, Button, Muted } from './Layout';
import { APP_URL } from '../client';

interface MembershipApprovedProps {
  recipientFirstName: string;
  chapterName: string;
  meetingDay?: string | null;
  meetingTime?: string | null;
}

export function MembershipApproved({
  recipientFirstName,
  chapterName,
  meetingDay,
  meetingTime,
}: MembershipApprovedProps) {
  return (
    <Layout preview={`Welcome to ${chapterName}`}>
      <Heading>Welcome to {chapterName}</Heading>
      <P>Hi {recipientFirstName},</P>
      <P>
        Your membership has been approved. You&rsquo;re now an active member of <strong>{chapterName}</strong> on RFR
        Network.
      </P>
      <P>Here&rsquo;s how to make the most of it from day one:</P>
      <P style={{ paddingLeft: 16 }}>
        1. Complete your profile so other members know what you do<br />
        2. Review upcoming meetings and RSVP<br />
        3. Send your first referral — the network works when everyone gives
      </P>

      {meetingDay && meetingTime ? (
        <P>
          Your chapter meets every <strong>{meetingDay} at {meetingTime}</strong>. See you there.
        </P>
      ) : null}

      <Button href={`${APP_URL}/dashboard`}>Go to Dashboard</Button>

      <Muted>
        Questions? Reply to this email and your chapter admin will get back to you.
      </Muted>
    </Layout>
  );
}
