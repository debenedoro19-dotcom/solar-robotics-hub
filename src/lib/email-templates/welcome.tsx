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
import { emailButton, emailCard, emailContainer, emailHeading, emailMain, emailMuted, emailText } from './email-styles'
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
          <Button style={button} href={dashboardUrl || 'https://tradeenergyhub.com/dashboard'}>
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

const main = emailMain
const container = emailContainer
const card = emailCard
const h1 = emailHeading
const p = emailText
const button = emailButton
const muted = emailMuted
