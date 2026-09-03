import React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { EmailHeader } from './email-brand'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  dashboardUrl?: string
}

const Email = ({ name, dashboardUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Tesla Trade account is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailHeader />
        <Section style={card}>
          <Heading style={h1}>Welcome{name ? `, ${name}` : ''}</Heading>
          <Text style={p}>
            Your Tesla Trade account is live. Fund your wallet to unlock investment plans across
            vehicles, energy storage, solar and robotics.
          </Text>
          <Text style={p}>
            Every plan purchase draws from your wallet balance, so deposits are the first step.
          </Text>
          <Button style={button} href={dashboardUrl || 'https://tradeenergy.app/dashboard'}>
            Open your dashboard
          </Button>
          <Text style={muted}>
            Need a hand? Reply to this email or open a support ticket from your dashboard.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Welcome to Tesla Trade',
  displayName: 'Welcome email',
  previewData: { name: 'Jane' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const card = {
  border: '1px solid #e6e7eb',
  borderTop: 'none',
  borderRadius: '0 0 20px 20px',
  padding: '28px',
}
const h1 = { fontSize: '22px', color: '#0d0e12', margin: '0 0 18px' }
const p = { fontSize: '15px', lineHeight: '1.65', color: '#3f4147', margin: '0 0 16px' }
const button = {
  display: 'inline-block',
  background: '#E82127',
  color: '#ffffff',
  fontSize: '15px',
  fontWeight: 600,
  padding: '12px 22px',
  borderRadius: '12px',
  textDecoration: 'none',
}
const muted = { fontSize: '12px', color: '#8b8d94', margin: '22px 0 0' }
