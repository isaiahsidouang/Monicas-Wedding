import { auth } from '@/auth'
import { google } from 'googleapis'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.accessToken) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { to, subject, body } = await req.json()

  if (!to || !subject || !body) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: session.accessToken })
  const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

  const raw = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\n')

  const encoded = Buffer.from(raw).toString('base64url')

  try {
    const res = await gmail.users.drafts.create({
      userId: 'me',
      requestBody: {
        message: { raw: encoded },
      },
    })

    return Response.json({ draftId: res.data.id, success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create draft'
    return Response.json({ error: message }, { status: 500 })
  }
}
