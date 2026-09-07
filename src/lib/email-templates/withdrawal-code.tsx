import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from './email-brand'
import { emailCard, emailContainer, emailDetailBox, emailHeading, emailMain, emailMuted, emailText } from './email-styles'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  code?: string
  amount?: string
  destination?: string
  txCode?: string
}

const Email = ({ name, code, amount, destination, txCode }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your withdrawal — code {code || ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailHeader />
        <Section style={card}>
          <Heading style={h1}>Confirm your withdrawal</Heading>
          <Text style={p}>Hi {name || 'there'},</Text>
          <Text style={p}>
            You requested a withdrawal of <strong>{amount || '—'}</strong>
            {destination ? ` to ${destination}` : ''}. Enter the confirmation code below in your account to release
            it for payout. The code expires in 30 minutes.
          </Text>
          <Section style={codeBox}>
            <Text style={codeText}>{code || '------'}</Text>
          </Section>
          {txCode ? <Text style={row}>Transaction ID: {txCode}</Text> : null}
          <Text style={p}>
            If you did not request this withdrawal, do not enter the code — the request expires on its own and the
            funds are returned to your wallet. Change your password and contact support immediately.
          </Text>
          <Text style={muted}>Tesla Trade · Never share this code with anyone, including our staff.</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Confirm your withdrawal request',
  displayName: 'Withdrawal confirmation code',
  previewData: { name: 'Jane', code: '481902', amount: '$1,250.00', destination: 'Crypto wallet', txCode: 'TXW-9F2A1B' },
} satisfies TemplateEntry

const main = emailMain
const container = emailContainer
const card = emailCard
const h1 = emailHeading
const p = emailText
const codeBox = {
  ...emailDetailBox,
  padding: '18px',
  textAlign: 'center' as const,
}
const codeText = {
  fontSize: '30px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: '#ffffff',
  margin: '0',
}
const row = { fontSize: '12px', color: '#71717a', margin: '0 0 14px' }
const muted = emailMuted
