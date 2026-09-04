import * as React from 'react'
import { Hr, Img, Link, Section, Text } from '@react-email/components'

// Publicly-hosted brand assets, served from the primary custom domain so they
// load reliably inside every email client.
const LOGO_URL = 'https://tradeenergyhub.com/tesla-mark-email.png'
const WALTER_PHOTO = 'https://tradeenergyhub.com/walter-portrait.jpg'

export const SUPPORT_EMAIL = 'support@tradeenergyhub.com'
export const NOREPLY_EMAIL = 'noreply@tradeenergyhub.com'
export const CAMPAIGN_EMAIL = 'walter@tradeenergyhub.com'

interface EmailHeaderProps {
  siteName?: string
  tagline?: string
}

export const EmailHeader = ({
  siteName = 'Trade Tesla',
  tagline = 'Tesla Ecosystem Investment Platform',
}: EmailHeaderProps) => (
  <Section style={header}>
    <Img
      src={LOGO_URL}
      alt={`${siteName} logo`}
      width={48}
      height={48}
      style={logo}
    />
    <Text style={brand}>
      TRADE<span style={{ color: '#E31937' }}> TESLA</span>
    </Text>
    <Text style={kicker}>{tagline}</Text>
  </Section>
)

/** Support footer used on automated (noreply@) emails. */
export const EmailFooter = () => (
  <Section style={footerWrap}>
    <Hr style={rule} />
    <Text style={footerText}>
      Sent automatically from {NOREPLY_EMAIL} — replies to this address are not
      monitored. Need a hand? Write to{' '}
      <Link href={`mailto:${SUPPORT_EMAIL}`} style={link}>
        {SUPPORT_EMAIL}
      </Link>
      .
    </Text>
    <Text style={footerFine}>© 2026 Trade Tesla. All rights reserved.</Text>
  </Section>
)

/** Signature block for campaign / relationship emails sent from walter@. */
export const EmailSignature = ({
  name = 'Walter Reinhardt',
  title = 'Head of Investor Relations',
  email = CAMPAIGN_EMAIL,
}: {
  name?: string
  title?: string
  email?: string
}) => (
  <Section style={sigWrap}>
    <Hr style={rule} />
    <table role="presentation" cellPadding={0} cellSpacing={0} style={{ borderCollapse: 'collapse' }}>
      <tbody>
        <tr>
          <td style={{ paddingRight: '14px', verticalAlign: 'middle' }}>
            <Img src={WALTER_PHOTO} alt={name} width={56} height={56} style={avatar} />
          </td>
          <td style={{ verticalAlign: 'middle' }}>
            <Text style={sigName}>{name}</Text>
            <Text style={sigTitle}>{title}</Text>
            <Link href={`mailto:${email}`} style={link}>
              {email}
            </Link>
          </td>
        </tr>
      </tbody>
    </table>
  </Section>
)

const header = {
  backgroundColor: '#0A0A0A',
  borderRadius: '20px 20px 0 0',
  padding: '28px',
  textAlign: 'center' as const,
}
const logo = { margin: '0 auto 12px', display: 'block' }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0', letterSpacing: '0.12em' }
const kicker = {
  color: '#8b8d94',
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}
const rule = { borderColor: '#e6e7eb', margin: '24px 0 16px' }
const footerWrap = { padding: '0 4px' }
const footerText = { fontSize: '12px', color: '#7a7c83', lineHeight: '1.6', margin: '0 0 6px' }
const footerFine = { fontSize: '11px', color: '#a0a2a8', margin: '0' }
const link = { color: '#E31937', textDecoration: 'none', fontSize: '12px' }
const sigWrap = { padding: '0 4px' }
const avatar = { borderRadius: '28px', display: 'block' }
const sigName = { fontSize: '14px', fontWeight: 700, color: '#0d0e12', margin: '0' }
const sigTitle = { fontSize: '12px', color: '#7a7c83', margin: '2px 0 4px' }
