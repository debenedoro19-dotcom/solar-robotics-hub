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
import { EmailHeader } from './email-brand'
import { emailButton, emailCard, emailContainer, emailHeading, emailMain, emailMuted, emailText } from './email-styles'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head>
      <style>{darkModeCss}</style>
    </Head>
    <Preview>Reset your password for {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <EmailHeader siteName={siteName} />
        <Section style={card}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            We received a request to reset your password for {siteName}. Click
            the button below to choose a new password.
          </Text>
          <Button className="dm-btn" style={button} href={confirmationUrl}>
            Reset Password
          </Button>
          <Text style={footer}>
            If you didn't request a password reset, you can safely ignore this
            email. Your password will not be changed.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

const main = emailMain
const container = emailContainer
const card = emailCard
const h1 = emailHeading
const text = emailText
const button = emailButton
const footer = emailMuted
// Rendered as a text child, which React may HTML-escape: keep this CSS free of >, &, and quotes.
const darkModeCss = `
  @media (prefers-color-scheme: dark) {
    .dm-btn { background-color: #000000 !important; color: #ffffff !important; }
  }
  [data-ogsc] .dm-btn { background-color: #000000 !important; color: #ffffff !important; }
  [data-ogsb] .dm-btn { background-color: #000000 !important; color: #ffffff !important; }
`
