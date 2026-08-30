import { createFileRoute } from '@tanstack/react-router'

type Payload = {
  type?: string
  to?: string
  name?: string
  amount?: string
  subject?: string
  message?: string
  templateSubject?: string
  templateBody?: string
  senderName?: string
  senderEmail?: string
}

function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? '')
}

function wrap(title: string, body: string) {
  const html = body
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 16px;line-height:1.65;color:#3f4147;font-size:15px">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
  return `<!doctype html><html><body style="margin:0;background:#ffffff;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="border-radius:24px;overflow:hidden;border:1px solid #e6e7eb">
      <div style="background:#050507;padding:28px 28px 24px">
        <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.02em">TESLA<span style="color:#E82127">TRADE</span></div>
        <div style="color:#8b8d94;font-size:11px;letter-spacing:.18em;text-transform:uppercase;margin-top:6px">Clean-Tech Investment Platform</div>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 18px;font-size:20px;color:#0d0e12;letter-spacing:-0.02em">${title}</h1>
        ${html}
      </div>
      <div style="padding:18px 28px;background:#f7f7f9;color:#8b8d94;font-size:12px">
        Tesla Trade Energy · This is an automated message about your account activity.
      </div>
    </div>
  </div></body></html>`
}

export const Route = createFileRoute('/api/send-email')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env['RESEND_API_KEY']
        if (!apiKey) {
          return Response.json({ error: 'Email service is not configured.' }, { status: 500 })
        }

        let payload: Payload
        try {
          payload = (await request.json()) as Payload
        } catch {
          return Response.json({ error: 'Invalid request body.' }, { status: 400 })
        }

        const to = (payload.to ?? '').trim()
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
          return Response.json({ error: 'A valid recipient address is required.' }, { status: 400 })
        }

        const vars = {
          name: payload.name ?? 'there',
          amount: payload.amount ?? '',
          message: payload.message ?? '',
        }

        const subject = fill(
          payload.templateSubject || payload.subject || 'Tesla Trade notification',
          vars,
        )
        const bodyText = fill(
          payload.templateBody ||
            payload.message ||
            `Hi ${vars.name},\n\nThere is an update on your Tesla Trade account.`,
          vars,
        )

        const senderName = payload.senderName || 'Tesla Trade Energy'
        const senderEmail = payload.senderEmail || 'noreply@tradeenergy.app'

        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `${senderName} <${senderEmail}>`,
            to: [to],
            subject,
            html: wrap(subject, bodyText),
            text: bodyText,
          }),
        })

        if (!res.ok) {
          const detail = await res.text().catch(() => '')
          console.error('[send-email] provider rejected send', res.status, detail)
          return Response.json(
            { error: 'The email provider rejected the send. Check the sender domain is verified.' },
            { status: 502 },
          )
        }

        return Response.json({ ok: true })
      },
    },
  },
})
