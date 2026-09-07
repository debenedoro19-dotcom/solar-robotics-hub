import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from './email-brand'
import { emailCard, emailContainer, emailDetailBox, emailHeading, emailMain, emailMuted, emailText } from './email-styles'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  title?: string
  message?: string
  device?: string
  ip?: string
  when?: string
}

const Email = ({ name, title, message, device, ip, when }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{title || 'Security alert on your account'}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailHeader />
        <Section style={card}>
          <Heading style={h1}>{title || 'New sign-in to your account'}</Heading>
          <Text style={p}>Hi {name || 'there'},</Text>
          <Text style={p}>
            {message ||
              'We noticed a sign-in to your Tesla Trade account from a device we have not seen before.'}
          </Text>
          <Section style={detailBox}>
            <Text style={row}>
              <strong>Device:</strong> {device || 'Unknown device'}
            </Text>
            <Text style={row}>
              <strong>IP address:</strong> {ip || 'Unavailable'}
            </Text>
            <Text style={row}>
              <strong>Time (UTC):</strong> {when || new Date().toISOString().replace('T', ' ').slice(0, 19)}
            </Text>
          </Section>
          <Text style={p}>
            If this was you, no action is needed. If you do not recognise this activity, change your password
            immediately and turn on two-factor authentication from your account security settings.
          </Text>
          <Text style={muted}>Tesla Trade · Security notification</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) => (data['title'] as string) || 'New sign-in to your account',
  displayName: 'Security alert',
  previewData: {
    name: 'Jane',
    device: 'Chrome on macOS',
    ip: '102.89.44.10',
    when: '2026-09-04 10:12:00',
  },
} satisfies TemplateEntry

const main = emailMain
const container = emailContainer
const card = emailCard
const h1 = emailHeading
const p = emailText
const detailBox = emailDetailBox
const row = { fontSize: '13px', lineHeight: '20px', color: '#ffffff', margin: '0 0 4px' }
const muted = emailMuted
