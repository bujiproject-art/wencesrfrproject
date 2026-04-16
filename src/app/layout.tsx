import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RFR Network — Connection is Currency',
  description:
    'RFR Network is a premium referral networking community. Find a chapter, join members who are building real businesses, and turn connection into currency.',
  openGraph: {
    title: 'RFR Network — Connection is Currency',
    description:
      'A premium referral network for business builders. Find a chapter, exchange referrals, grow together.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-ink-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
