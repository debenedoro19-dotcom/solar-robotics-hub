import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'

// Publicly-hosted Tesla mark used in all email templates.
// This image is served from the primary custom domain so it loads
// reliably inside every email client.
const LOGO_URL = 'https://tradeenergyhub.com/tesla-mark-email.png'

interface EmailHeaderProps {
  siteName?: string
  tagline?: string
}

export const EmailHeader = ({
  siteName = 'Tesla Energy Hub',
  tagline = 'Clean-Tech Investment Platform',
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
      TESLA<span style={{ color: '#E82127' }}>TRADE</span>
    </Text>
    <Text style={kicker}>{tagline}</Text>
  </Section>
)

const header = {
  backgroundColor: '#050507',
  borderRadius: '20px 20px 0 0',
  padding: '28px',
  textAlign: 'center' as const,
}
const logo = { margin: '0 auto 12px', display: 'block' }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0' }
const kicker = {
  color: '#8b8d94',
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}
