// Canonical public origin used for links that leave the app (e.g. the URL an
// emailed verification link comes back to). Local development origins are
// never emailable, so they fall back to the live site.
export const CANONICAL_SITE_URL = 'https://tradeenergyhub.com'

export function emailSafeOrigin(): string {
  if (typeof window === 'undefined') return CANONICAL_SITE_URL
  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) {
    return CANONICAL_SITE_URL
  }
  return window.location.origin
}
