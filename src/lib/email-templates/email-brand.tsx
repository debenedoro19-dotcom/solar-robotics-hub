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
  siteName = 'Trade Tesla',
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
      TRADE TESLA
    </Text>
    <Text style={kicker}>{tagline}</Text>
  </Section>
)

const header = {
  backgroundColor: '#000000',
  borderRadius: '20px 20px 0 0',
  padding: '34px 28px 28px',
  textAlign: 'center' as const,
}
const logo = { margin: '0 auto 14px', display: 'block' }
const brand = { color: '#ffffff', fontSize: '15px', fontWeight: 500, letterSpacing: '0.42em', margin: '0' }
const kicker = {
  color: '#a2a3a5',
  fontSize: '10px',
  letterSpacing: '0.28em',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}
