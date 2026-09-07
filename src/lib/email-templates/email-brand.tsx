import * as React from 'react'
import { Img, Section, Text } from '@react-email/components'

// Small, light-background Tesla mark (under 2 KB) served from the primary
// custom domain so it renders instantly in every email client.
const LOGO_URL = 'https://tradeenergyhub.com/tesla-logo-light.png'

interface EmailHeaderProps {
  siteName?: string
  tagline?: string
}

export const EmailHeader = ({
  siteName = 'Tesla Trade',
  tagline = 'Clean-Tech Investment Platform',
}: EmailHeaderProps) => (
  <Section style={header}>
    <Img
      src={LOGO_URL}
      alt={`${siteName} logo`}
      width={44}
      height={44}
      style={logo}
    />
    <Text style={brand}>
      TESLA<span style={{ color: '#E82127' }}>TRADE</span>
    </Text>
    <Text style={kicker}>{tagline}</Text>
  </Section>
)

const header = {
  backgroundColor: '#0d0e12',
  border: '1px solid #25262c',
  borderBottom: '1px solid #1c1d22',
  borderRadius: '16px 16px 0 0',
  padding: '30px 28px 24px',
  textAlign: 'center' as const,
}
const logo = { margin: '0 auto 12px', display: 'block' }
const brand = { color: '#ffffff', fontSize: '19px', fontWeight: 800, letterSpacing: '0.12em', margin: '0' }
const kicker = {
  color: '#71717a',
  fontSize: '10px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}
