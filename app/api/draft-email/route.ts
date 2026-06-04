import { auth } from '@/auth'
import { draftInquiryEmail, draftFollowUpEmail } from '@/lib/claude'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const body = await req.json()
  const { type, venue } = body

  try {
    if (type === 'inquiry') {
      const draft = await draftInquiryEmail(venue)
      return Response.json(draft)
    }

    if (type === 'follow-up') {
      const draft = await draftFollowUpEmail(venue)
      return Response.json(draft)
    }

    return Response.json({ error: 'Unknown draft type' }, { status: 400 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate draft'
    return Response.json({ error: message }, { status: 500 })
  }
}
