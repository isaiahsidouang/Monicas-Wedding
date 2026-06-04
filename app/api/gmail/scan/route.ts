import { auth } from '@/auth'
import { google } from 'googleapis'
import { analyzeEmails } from '@/lib/claude'

const WEDDING_KEYWORDS = [
  'wedding', 'venue', 'reception', 'ceremony', 'ballroom', 'event space',
  'catering', 'florist', 'photographer', 'videographer', 'band', 'DJ',
  'hotel', 'resort', 'availability', 'package', 'pricing', 'quote',
]

function buildQuery(): string {
  const kw = WEDDING_KEYWORDS.slice(0, 6).join(' OR ')
  return `(${kw}) newer_than:365d`
}

export async function GET() {
  const session = await auth()
  if (!session?.accessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  try {
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      q: buildQuery(),
      maxResults: 50,
    })

    const messages = listRes.data.messages || []

    const rawEmails = await Promise.all(
      messages.map(async (msg) => {
        const full = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        })

        const headers = full.data.payload?.headers || []
        const subject = headers.find((h) => h.name === 'Subject')?.value || '(no subject)'
        const from = headers.find((h) => h.name === 'From')?.value || ''
        const date = headers.find((h) => h.name === 'Date')?.value || ''

        const body = extractBody(full.data.payload)

        return {
          id: msg.id!,
          threadId: msg.threadId!,
          subject,
          from,
          date,
          body,
        }
      })
    )

    const venues = await analyzeEmails(rawEmails)
    return Response.json({ venues, scanned: rawEmails.length })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to scan Gmail'
    return Response.json({ error: message }, { status: 500 })
  }
}

function extractBody(payload: { mimeType?: string | null; body?: { data?: string | null } | null; parts?: unknown[] | null } | null | undefined): string {
  if (!payload) return ''

  if (payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8').slice(0, 3000)
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const p = part as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }
      if (p.mimeType === 'text/plain' && p.body?.data) {
        return Buffer.from(p.body.data, 'base64').toString('utf-8').slice(0, 3000)
      }
    }
    for (const part of payload.parts) {
      const p = part as { mimeType?: string; body?: { data?: string }; parts?: unknown[] }
      if (p.mimeType === 'text/html' && p.body?.data) {
        const html = Buffer.from(p.body.data, 'base64').toString('utf-8')
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 3000)
      }
    }
  }

  return ''
}
