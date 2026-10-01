import React from 'react'
import { Body, Container, Head, Heading, Html, Preview, Section, Text } from '@react-email/components'
import { EmailHeader } from './email-brand'
import { emailCard, emailContainer, emailDetailBox, emailHeading, emailMain, emailMuted, emailText } from './email-styles'
import type { TemplateEntry } from './registry'

interface Props {
  name?: string
  heading?: string
  intro?: string
  orderNumber?: string
  itemName?: string
  amount?: string
  paymentMethod?: string
  status?: string
  tracking?: string
  address?: string
  note?: string
}

const Row = ({ label, value }: { label: string; value?: string }) =>
  value ? (
    <Text style={row}>
      <span style={rowLabel}>{label}</span>
      <br />
      <span style={rowValue}>{value}</span>
    </Text>
  ) : null

const Email = (p: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{p.heading || 'Your Trade Tesla order'}</Preview>
    <Body style={emailMain}>
      <Container style={emailContainer}>
        <EmailHeader />
        <Section style={emailCard}>
          <Heading style={emailHeading}>{p.heading || 'Order update'}</Heading>
          <Text style={emailText}>Hi {p.name || 'there'},</Text>
          <Text style={emailText}>{p.intro || 'Here is the latest on your order.'}</Text>
          <Section style={emailDetailBox}>
            <Row label="Order number" value={p.orderNumber} />
            <Row label="Item" value={p.itemName} />
            <Row label="Amount" value={p.amount} />
            <Row label="Payment" value={p.paymentMethod} />
            <Row label="Status" value={p.status} />
            <Row label="Tracking number" value={p.tracking} />
            <Row label="Delivery address" value={p.address} />
          </Section>
          {p.note ? <Text style={emailText}>{p.note}</Text> : null}
          <Text style={emailMuted}>
            You are receiving this because you placed an order on Trade Tesla. Track every order from your account.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `${d['heading'] || 'Order update'} — ${d['orderNumber'] || 'Trade Tesla'}`,
  displayName: 'Inventory order',
  previewData: {
    name: 'Jane',
    heading: 'Order confirmed',
    intro: 'Thank you for your purchase. Your payment has been received and your order is confirmed.',
    orderNumber: 'TT-8F2A91C0',
    itemName: '2025 Model Y Juniper Performance',
    amount: '$59,990',
    paymentMethod: 'Wallet balance',
    status: 'Paid',
    address: '120 Market St, San Francisco, CA 94105, United States',
  },
} satisfies TemplateEntry

const row = { margin: '0 0 12px', fontSize: '14px', lineHeight: '20px' }
const rowLabel = { color: '#71717a', fontSize: '11px', textTransform: 'uppercase' as const, letterSpacing: '1px' }
const rowValue = { color: '#000000', fontWeight: '600' as const }
