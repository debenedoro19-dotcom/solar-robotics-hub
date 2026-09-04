import * as React from 'react'
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
import { EmailFooter, EmailHeader, EmailSignature } from './email-brand'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  title?: string
  message?: string
  ctaLabel?: string
  ctaUrl?: string
}

const Email = ({ name, title, message, ctaLabel, ctaUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'A note from Trade Tesla investor relations'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailHeader />
        <Section style={card}>
          <Heading style={h1}>{title || 'Investor update'}</Heading>
          <Text style={p}>Hi {name || 'there'},</Text>
          {(message || 'Here is the latest from the Trade Tesla desk.')
            .split('\n\n')
            .map((line, i) => (
              <Text key={i} style={p}>
                {line}
              </Text>
            ))}
          {ctaUrl ? (
            <Button style={button} href={ctaUrl}>
              {ctaLabel || 'Open your dashboard'}
            </Button>
          ) : null}
          <EmailSignature />
        </Section>
        <EmailFooter />
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    (data['title'] as string) || 'An update from Trade Tesla',
  displayName: 'Investor update (walter@)',
  previewData: {
    name: 'Jane',
    title: 'Q3 Tesla ecosystem allocation review',
    message:
      'Energy storage deployments set another record this quarter, and our Megapack-linked plans reflect that momentum.',
    ctaLabel: 'Review your allocation',
    ctaUrl: 'https://tradeenergyhub.com/dashboard',
  },
} satisfies TemplateEntry

export default Email

const main = { backgroundColor: '#ffffff', fontFamily: 'Helvetica, Arial, sans-serif' }
const container = { maxWidth: '560px', margin: '0 auto', padding: '32px 24px' }
const card = {
  border: '1px solid #e6e7eb',
  borderTop: 'none',
  borderRadius: '0 0 20px 20px',
  padding: '28px',
}
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: '#0d0e12', margin: '0 0 18px' }
const p = { fontSize: '14px', color: '#3f4147', lineHeight: '1.65', margin: '0 0 14px' }
const button = {
  backgroundColor: '#E31937',
  color: '#ffffff',
  fontSize: '13px',
  fontWeight: 700 as const,
  padding: '12px 22px',
  borderRadius: '12px',
  textDecoration: 'none',
  display: 'inline-block',
  margin: '8px 0 4px',
}
