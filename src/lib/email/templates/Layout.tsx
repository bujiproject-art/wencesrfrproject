import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components';

interface LayoutProps {
  preview: string;
  children: React.ReactNode;
}

/**
 * RFR Network email layout — gold/black branding, "Connection is currency" footer.
 * Separate from Agent Midas's MidasEmailLayout.
 */
export function Layout({ preview, children }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={headerStyle}>
            <Text style={logoStyle}>RFR NETWORK</Text>
            <Text style={taglineStyle}>Referrals · Relationships · Results</Text>
          </Section>
          <Section style={contentStyle}>{children}</Section>
          <Hr style={hrStyle} />
          <Section style={footerStyle}>
            <Text style={footerTextStyle}>Connection is currency.</Text>
            <Text style={footerMutedStyle}>
              RFR Network · <Link href="https://rfr-network.agentmidas.xyz" style={footerLinkStyle}>rfr-network.agentmidas.xyz</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function Heading({ children }: { children: React.ReactNode }) {
  return <Text style={headingStyle}>{children}</Text>;
}

export function P({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...paragraphStyle, ...(style || {}) }}>{children}</Text>;
}

export function Muted({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <Text style={{ ...mutedStyle, ...(style || {}) }}>{children}</Text>;
}

export function Button({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Section style={{ textAlign: 'center', margin: '24px 0' }}>
      <Link href={href} style={buttonStyle}>
        {children}
      </Link>
    </Section>
  );
}

export function Divider() {
  return <Hr style={hrStyle} />;
}

const GOLD = '#D4AF37';
const BLACK = '#0A0A0A';
const DARK = '#1a1a1a';
const LIGHT = '#e8e8e8';
const MUTED = '#888888';
const BORDER = '#2a2a2a';

const bodyStyle: React.CSSProperties = {
  backgroundColor: BLACK,
  color: LIGHT,
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  margin: 0,
  padding: '40px 0',
};

const containerStyle: React.CSSProperties = {
  backgroundColor: DARK,
  borderRadius: 12,
  border: `1px solid ${BORDER}`,
  maxWidth: 600,
  margin: '0 auto',
  padding: 0,
  overflow: 'hidden',
};

const headerStyle: React.CSSProperties = {
  backgroundColor: BLACK,
  padding: '24px 32px',
  borderBottom: `1px solid ${BORDER}`,
  textAlign: 'center',
};

const logoStyle: React.CSSProperties = {
  color: GOLD,
  fontSize: 22,
  fontWeight: 700,
  letterSpacing: 2,
  margin: 0,
};

const taglineStyle: React.CSSProperties = {
  color: MUTED,
  fontSize: 11,
  letterSpacing: 1,
  margin: '4px 0 0 0',
  textTransform: 'uppercase',
};

const contentStyle: React.CSSProperties = {
  padding: '32px',
};

const headingStyle: React.CSSProperties = {
  color: GOLD,
  fontSize: 20,
  fontWeight: 700,
  margin: '0 0 16px 0',
  lineHeight: 1.3,
};

const paragraphStyle: React.CSSProperties = {
  color: LIGHT,
  fontSize: 15,
  lineHeight: 1.6,
  margin: '0 0 16px 0',
};

const mutedStyle: React.CSSProperties = {
  color: MUTED,
  fontSize: 13,
  lineHeight: 1.5,
  margin: '16px 0 0 0',
};

const buttonStyle: React.CSSProperties = {
  backgroundColor: GOLD,
  color: BLACK,
  padding: '14px 32px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 700,
  textDecoration: 'none',
  display: 'inline-block',
};

const hrStyle: React.CSSProperties = {
  borderColor: BORDER,
  margin: '24px 0',
};

const footerStyle: React.CSSProperties = {
  padding: '16px 32px 24px 32px',
  textAlign: 'center',
};

const footerTextStyle: React.CSSProperties = {
  color: GOLD,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: 1,
  margin: '0 0 4px 0',
  textTransform: 'uppercase',
};

const footerMutedStyle: React.CSSProperties = {
  color: MUTED,
  fontSize: 11,
  margin: 0,
};

const footerLinkStyle: React.CSSProperties = {
  color: MUTED,
  textDecoration: 'underline',
};
