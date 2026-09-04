import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from './email-brand'
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
          <Text style={muted}>Tesla Energy Hub · Never share this code with anyone, including our staff.</Text>
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

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, Helvetica, sans-serif' }
const container = { padding: '24px 20px', maxWidth: '560px' }
const card = { border: '1px solid #e6e8eb', borderRadius: '14px', padding: '26px 24px', backgroundColor: '#ffffff' }
const h1 = { fontSize: '20px', margin: '0 0 14px', color: '#171a20' }
const p = { fontSize: '14px', lineHeight: '22px', color: '#3b3f46', margin: '0 0 12px' }
const codeBox = {
  backgroundColor: '#f6f7f9',
  border: '1px solid #e6e8eb',
  borderRadius: '10px',
  padding: '16px',
  textAlign: 'center' as const,
  margin: '0 0 14px',
}
const codeText = {
  fontSize: '30px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: '#171a20',
  margin: '0',
}
const row = { fontSize: '12px', color: '#8a9099', margin: '0 0 12px' }
const muted = { fontSize: '11px', color: '#8a9099', margin: '18px 0 0' }
