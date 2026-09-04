import { getRequest } from '@tanstack/react-start/server'

export const ISSUER = 'Tesla Trade'

export async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export function clientIp(): string {
  try {
    const req = getRequest()
    const fwd = req.headers.get('x-forwarded-for') ?? ''
    return (
      fwd.split(',')[0]?.trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      'unknown'
    )
  } catch {
    return 'unknown'
  }
}

export function requestUserAgent(): string {
  try {
    return getRequest().headers.get('user-agent') ?? ''
  } catch {
    return ''
  }
}

/** Human label like "Chrome on Windows" from a user-agent string. */
export function describeDevice(ua: string): { label: string; browser: string; os: string } {
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /OPR\//.test(ua)
      ? 'Opera'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : /Firefox\//.test(ua)
            ? 'Firefox'
            : 'Browser'
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad|iOS/.test(ua)
        ? 'iOS'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : 'Unknown OS'
  return { label: `${browser} on ${os}`, browser, os }
}

/** Six-digit numeric code for emailed withdrawal confirmation. */
export function generateEmailCode(): string {
  const buf = new Uint32Array(6)
  crypto.getRandomValues(buf)
  return Array.from(buf, (n) => String(n % 10)).join('')
}

export function randomBackupCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const buf = new Uint32Array(10)
  crypto.getRandomValues(buf)
  const raw = Array.from(buf, (n) => alphabet[n % alphabet.length]).join('')
  return `${raw.slice(0, 5)}-${raw.slice(5)}`
}

/** Shared TOTP / backup-code verification. Server-only. */
export async function verifyTotpForUser(
  userId: string,
  label: string,
  code: string,
): Promise<{ ok: true; usedBackupCode: boolean } | { ok: false; error: string }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
  const OTPAuth = await import('otpauth')

  const { data: row } = await supabaseAdmin
    .from('user_2fa')
    .select('secret, enabled, backup_codes, failed_attempts, locked_until')
    .eq('user_id', userId)
    .maybeSingle()

  if (!row?.enabled) return { ok: false, error: 'Two-factor authentication is not enabled' }
  if (row.locked_until && new Date(row.locked_until).getTime() > Date.now()) {
    return { ok: false, error: 'Too many incorrect codes. Try again in a few minutes.' }
  }

  const cleaned = code.trim().toUpperCase()
  const totp = new OTPAuth.TOTP({ issuer: ISSUER, label, secret: OTPAuth.Secret.fromBase32(row.secret) })
  const totpOk = totp.validate({ token: cleaned.replace(/\D/g, ''), window: 1 }) !== null

  let usedBackupCode = false
  if (!totpOk) {
    const hash = await sha256(cleaned)
    const stored: string[] = row.backup_codes ?? []
    const remaining = stored.filter((c) => c !== hash)
    if (remaining.length === stored.length) {
      const attempts = (row.failed_attempts ?? 0) + 1
      await supabaseAdmin
        .from('user_2fa')
        .update({
          failed_attempts: attempts,
          locked_until: attempts >= 5 ? new Date(Date.now() + 10 * 60_000).toISOString() : null,
        })
        .eq('user_id', userId)
      return { ok: false, error: 'Incorrect authentication code' }
    }
    usedBackupCode = true
    await supabaseAdmin.from('user_2fa').update({ backup_codes: remaining }).eq('user_id', userId)
  }

  await supabaseAdmin
    .from('user_2fa')
    .update({ failed_attempts: 0, locked_until: null, last_used_at: new Date().toISOString() })
    .eq('user_id', userId)

  return { ok: true, usedBackupCode }
}
