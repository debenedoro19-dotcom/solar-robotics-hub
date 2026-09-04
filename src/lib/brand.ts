/**
 * Single source of truth for Trade Tesla brand identity.
 * Used by the site chrome, emails, modals and meta titles.
 */
export const BRAND_NAME = 'Trade Tesla'
export const BRAND_FULL_NAME = 'Trade Tesla – Tesla Ecosystem Investment Platform'
export const BRAND_DOMAIN = 'tradeenergyhub.com'
export const SITE_URL = `https://${BRAND_DOMAIN}`

export const EMAILS = {
  support: `support@${BRAND_DOMAIN}`,
  hello: `hello@${BRAND_DOMAIN}`,
  admin: `admin@${BRAND_DOMAIN}`,
  noreply: `noreply@${BRAND_DOMAIN}`,
  campaigns: `walter@${BRAND_DOMAIN}`,
} as const

export const CAMPAIGN_SENDER = {
  name: 'Walter Reinhardt',
  title: 'Head of Investor Relations',
  email: EMAILS.campaigns,
  photo: `${SITE_URL}/walter-portrait.jpg`,
} as const
