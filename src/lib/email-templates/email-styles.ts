// Cinematic minimalism: monochrome (#000 / #fff / #393C41), frosted card,
// uppercase micro-labels, rounded pill CTA. Body stays white for deliverability.
export const emailMain = {
  backgroundColor: '#ffffff',
  color: '#171a20',
  fontFamily: '"Gotham", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  margin: '0',
  padding: '0',
}

export const emailContainer = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 16px',
}

export const emailCard = {
  backgroundColor: '#f7f7f8',
  border: '1px solid #e6e7ea',
  borderTop: 'none',
  borderRadius: '0 0 20px 20px',
  padding: '36px 40px 36px',
}

export const emailHeading = {
  color: '#000000',
  fontSize: '26px',
  fontWeight: '500' as const,
  letterSpacing: '-0.01em',
  lineHeight: '1.25',
  margin: '0 0 18px',
}

export const emailText = {
  color: '#393c41',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

export const emailButton = {
  backgroundColor: '#000000',
  borderRadius: '999px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '13px',
  fontWeight: '600' as const,
  letterSpacing: '0.08em',
  textTransform: 'uppercase' as const,
  padding: '14px 32px',
  textDecoration: 'none',
}

export const emailDetailBox = {
  backgroundColor: '#ffffff',
  border: '1px solid #e6e7ea',
  borderRadius: '14px',
  padding: '18px 20px',
  margin: '6px 0 20px',
}

export const emailMuted = {
  borderTop: '1px solid #e6e7ea',
  color: '#5c5e62',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '28px 0 0',
  paddingTop: '20px',
}

export const emailLink = { color: '#000000', textDecoration: 'underline' }
