import * as React from 'react';
import { Layout, Heading, P, Button, Muted } from './Layout';
import { APP_URL } from '../client';

interface MeetingReminderProps {
  recipientFirstName: string;
  chapterName: string;
  meetingTitle: string;
  meetingDate: string;
  meetingTime: string;
  location?: string | null;
  virtualLink?: string | null;
  description?: string | null;
}

export function MeetingReminder({
  recipientFirstName,
  chapterName,
  meetingTitle,
  meetingDate,
  meetingTime,
  location,
  virtualLink,
  description,
}: MeetingReminderProps) {
  return (
    <Layout preview={`${meetingTitle} — ${meetingDate} at ${meetingTime}`}>
      <Heading>Upcoming chapter meeting</Heading>
      <P>Hi {recipientFirstName},</P>
      <P>
        This is a reminder that <strong>{chapterName}</strong> is meeting soon:
      </P>

      <table style={tableStyle}>
        <tbody>
          <tr>
            <td style={labelStyle}>Meeting</td>
            <td style={valueStyle}>{meetingTitle}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Date</td>
            <td style={valueStyle}>{meetingDate}</td>
          </tr>
          <tr>
            <td style={labelStyle}>Time</td>
            <td style={valueStyle}>{meetingTime}</td>
          </tr>
          {location ? (
            <tr>
              <td style={labelStyle}>Location</td>
              <td style={valueStyle}>{location}</td>
            </tr>
          ) : null}
          {virtualLink ? (
            <tr>
              <td style={labelStyle}>Virtual Link</td>
              <td style={valueStyle}>
                <a href={virtualLink} style={{ color: '#D4AF37', textDecoration: 'underline' }}>
                  Join online
                </a>
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>

      {description ? <P>{description}</P> : null}

      <Button href={`${APP_URL}/dashboard`}>View Chapter Dashboard</Button>

      <Muted>
        Bring a referral. Every meeting is an opportunity to hand off a lead and strengthen a relationship.
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
