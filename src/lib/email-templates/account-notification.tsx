import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  title?: string
  message?: string
  detail?: string
}

const Email = ({ name, title, message, detail }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'Account update'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>
            TESLA<span style={{ color: '#E82127' }}>TRADE</span>
          </Text>
          <Text style={kicker}>Clean-Tech Investment Platform</Text>
        </Section>
        <Section style={card}>
          <Heading style={h1}>{title || 'Account update'}</Heading>
          <Text style={p}>Hi {name || 'there'},</Text>
          {(message || 'There is an update on your account.')
            .split('\n\n')
            .map((line, i) => (
              <Text key={i} style={p}>
                {line}
              </Text>
            ))}
          {detail ? <Text style={detailBox}>{detail}</Text> : null}
          <Text style={muted}>
            You are receiving this because of activity on your Tesla Trade account.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    (data['title'] as string) || 'Tesla Trade account update',
  displayName: 'Account notification',
  previewData: {
    name: 'Jane',
    title: 'Deposit approved — funds credited',
    message: 'Your deposit of $2,500 has been confirmed and credited to your wallet balance.',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const header = { backgroundColor: '#050507', borderRadius: '20px 20px 0 0', padding: '28px' }
const brand = { color: '#ffffff', fontSize: '18px', fontWeight: 700, margin: '0' }
const kicker = {
  color: '#8b8d94',
  fontSize: '11px',
  letterSpacing: '0.18em',
  textTransform: 'uppercase' as const,
  margin: '6px 0 0',
}
const card = {
  border: '1px solid #e6e7eb',
  borderTop: 'none',
  borderRadius: '0 0 20px 20px',
  padding: '28px',
}
const h1 = { fontSize: '20px', color: '#0d0e12', margin: '0 0 18px' }
const p = { fontSize: '15px', lineHeight: '1.65', color: '#3f4147', margin: '0 0 16px' }
const detailBox = {
  fontSize: '14px',
  color: '#0d0e12',
  background: '#f5f6f8',
  borderRadius: '12px',
  padding: '14px 16px',
  margin: '0 0 16px',
}
const muted = { fontSize: '12px', color: '#8b8d94', margin: '20px 0 0' }
