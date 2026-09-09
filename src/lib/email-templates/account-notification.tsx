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
import { EmailHeader } from './email-brand'
import { emailCard, emailContainer, emailDetailBox, emailHeading, emailMain, emailMuted, emailText } from './email-styles'
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
        <EmailHeader />
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
            You are receiving this because of activity on your Trade Tesla account.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (data: Record<string, any>) =>
    (data['title'] as string) || 'Trade Tesla account update',
  displayName: 'Account notification',
  previewData: {
    name: 'Jane',
    title: 'Deposit approved — funds credited',
    message: 'Your deposit of $2,500 has been confirmed and credited to your wallet balance.',
  },
} satisfies TemplateEntry

const main = emailMain
const container = emailContainer
const card = emailCard
const h1 = emailHeading
const p = emailText
const detailBox = { ...emailDetailBox, color: '#ffffff', fontSize: '14px' }
const muted = emailMuted
