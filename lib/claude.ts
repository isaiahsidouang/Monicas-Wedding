import Anthropic from '@anthropic-ai/sdk'
import { weddingProfile } from './monica'
import type { VenueRecord } from '@/types'

function inferRegion(location: string): VenueRecord['region'] {
  const loc = location.toLowerCase()
  if (loc.includes('california') || loc.includes(', ca') || loc.includes('san francisco') ||
      loc.includes('los angeles') || loc.includes('dana point') || loc.includes('half moon bay') ||
      loc.includes('rancho mirage') || loc.includes('laguna'))                              return 'california'
  if (loc.includes('chicago') || loc.includes('illinois') || loc.includes(', il'))         return 'illinois'
  if (loc.includes('miami') || loc.includes('florida') || loc.includes(', fl') ||
      loc.includes('fort lauderdale') || loc.includes('bal harbour') ||
      loc.includes('coconut grove') || loc.includes('boca raton') ||
      loc.includes('palm beach') && !loc.includes('aruba'))                                 return 'miami'
  if (loc.includes('puerto rico') || loc.includes('san juan') || loc.includes('dorado'))   return 'puerto-rico'
  if (loc.includes('caribbean') || loc.includes('cayman') || loc.includes('aruba') ||
      loc.includes('bermuda') || loc.includes('bahamas') || loc.includes('turks') ||
      loc.includes('virgin islands') || loc.includes('antigua') ||
      loc.includes('barbados') || loc.includes('saint') || loc.includes('st.'))            return 'caribbean'
  return 'other'
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface RawEmail {
  id: string
  threadId: string
  subject: string
  from: string
  date: string
  body: string
}

const BATCH_SIZE = 10 // emails per Claude call — keeps prompts manageable

function buildAnalysisPrompt(emails: RawEmail[]): string {
  return `You are helping Monica plan her wedding. Analyze these emails and extract venue/vendor information.

Monica's requirements:
- Guest count: ~${weddingProfile.guestCount}
- Budget: $${weddingProfile.budgetMax.toLocaleString()} max for venue
- Locations: California, Chicago, Miami/South Florida, Puerto Rico, Caribbean
- Preferred brands: ${weddingProfile.preferredBrands.join(', ')}
- US dates: ${weddingProfile.usDates.join('; ')}
- Caribbean/PR dates: ${weddingProfile.caribbeanDates.join('; ')}
- NO venues in Mexico, no 3-star or lower, Caribbean venues must be oceanfront

For each email that is relevant to wedding venue/vendor planning, return EXACTLY ONE JSON object per email (not one per bullet point or amenity). Each object:
- emailIndex: the email number (1-based, matching "Email N" below) — one record per email
- name: the single primary venue or vendor name from that email
- type: "venue" | "vendor" | "unknown"
- contact: { email, name, phone, website } — from sender info; website is the venue's URL if mentioned in the email body or signature
- location: city and state only, e.g. "Chicago, IL" or "Miami Beach, FL" (short, no street address)
- venueRentalFee: Saturday rate only as a short string, e.g. "$12,000" or "$18,000/Sat" — max 20 chars, no breakdowns
- capacitySeated: maximum seated guests as a number string only, e.g. "350" or "450" — no room details
- capacityReception: maximum reception guests as a number string only, e.g. "600"
- availableDates: up to 4 most relevant dates from Oct/Nov/Jan (Monica's preferred months), comma-separated, e.g. "Oct 10, Oct 31, Nov 14, Jan 9" — no day-of-week labels, no year unless not 2026
- unavailableDates: only if explicitly stated as unavailable, keep short
- amenities: array of up to 4 key features, each 3-5 words max
- pros: array of up to 3 positives, each one short phrase
- cons: array of up to 3 concerns, each one short phrase
- notes: single sentence with the single most important unique fact about this venue
- priorityScore: 1-10 fit with Monica's requirements
- isOceanfront: boolean
- tier: luxury tier estimate, e.g. "5-star" or "Luxury"

Important: one object per relevant email. Keep all string fields SHORT — Monica needs to scan quickly. Skip emails that are newsletters, spam, or not venue/vendor related.

Emails:
${emails.map((e, i) => `--- Email ${i + 1} ---
Subject: ${e.subject}
From: ${e.from}
Date: ${e.date}
Body: ${e.body.slice(0, 1500)}`).join('\n\n')}

Return ONLY a valid JSON array. No markdown, no explanation.`
}

export async function analyzeEmails(emails: RawEmail[]): Promise<VenueRecord[]> {
  if (emails.length === 0) return []

  // Build a lookup map so records can reference their source email by index
  const emailByIndex = new Map(emails.map((e, i) => [i + 1, e]))

  // Process in batches to avoid context/token limits
  const batches: RawEmail[][] = []
  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    batches.push(emails.slice(i, i + BATCH_SIZE))
  }

  const allRecords: VenueRecord[] = []
  let batchOffset = 0

  for (const batch of batches) {
    // Reindex the batch so prompts always start at Email 1
    const reindexed = batch.map((e, i) => ({ ...e, _batchIndex: i + 1 }))
    const prompt = buildAnalysisPrompt(reindexed)

    try {
      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = response.content[0].type === 'text' ? response.content[0].text : ''
      // Strip any accidental markdown fences
      const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const parsed: Array<Record<string, unknown>> = JSON.parse(clean)

      for (const v of parsed) {
        const batchIdx   = typeof v.emailIndex === 'number' ? v.emailIndex : 1
        const globalIdx  = batchOffset + batchIdx
        const sourceEmail = emailByIndex.get(globalIdx)
        const location   = typeof v.location === 'string' ? v.location : ''

        allRecords.push({
          id:                sourceEmail?.id || crypto.randomUUID(),
          name:              typeof v.name === 'string' ? v.name : 'Unknown',
          type:              (v.type as VenueRecord['type']) || 'unknown',
          region:            inferRegion(location),
          contact:           (v.contact as VenueRecord['contact']) || { email: '' },
          location,
          venueRentalFee:    typeof v.venueRentalFee === 'string' ? v.venueRentalFee : undefined,
          capacitySeated:    typeof v.capacitySeated === 'string' ? v.capacitySeated : undefined,
          capacityReception: typeof v.capacityReception === 'string' ? v.capacityReception : undefined,
          availableDates:    typeof v.availableDates === 'string' ? v.availableDates : undefined,
          unavailableDates:  typeof v.unavailableDates === 'string' ? v.unavailableDates : undefined,
          amenities:         Array.isArray(v.amenities) ? v.amenities as string[] : [],
          pros:              Array.isArray(v.pros) ? v.pros as string[] : [],
          cons:              Array.isArray(v.cons) ? v.cons as string[] : [],
          notes:             typeof v.notes === 'string' ? v.notes : undefined,
          priorityScore:     typeof v.priorityScore === 'number' ? v.priorityScore : 5,
          priority:          '',
          status:            'new',
          emailSubject:      sourceEmail?.subject,
          emailDate:         sourceEmail?.date,
          gmailThreadId:     sourceEmail?.threadId,
          isOceanfront:      typeof v.isOceanfront === 'boolean' ? v.isOceanfront : undefined,
          tier:              typeof v.tier === 'string' ? v.tier : undefined,
          analyzedAt:        new Date().toISOString(),
        })
      }
    } catch (err) {
      console.error(`analyzeEmails batch ${batchOffset / BATCH_SIZE + 1} failed:`, err)
      // Continue with remaining batches rather than aborting everything
    }

    batchOffset += batch.length
  }

  return allRecords
}

export async function draftInquiryEmail(venue: {
  name: string
  location: string
  contactEmail: string
  description?: string
  isCaribbean?: boolean
}): Promise<{ subject: string; body: string }> {
  const dates = venue.isCaribbean ? weddingProfile.caribbeanDates : weddingProfile.usDates

  const prompt = `Draft a professional wedding venue inquiry email on behalf of Monica.

Venue: ${venue.name}
Location: ${venue.location}
${venue.description ? `About the venue: ${venue.description}` : ''}

Wedding details:
- Guest count: approximately ${weddingProfile.guestCount} guests
- Budget: up to $${weddingProfile.budgetMax.toLocaleString()} for the venue
- Preferred dates: ${dates.join('; ')}
- Looking for: full wedding package including ceremony and reception space

Write a warm but professional inquiry email. Be specific about our needs. Ask about:
1. Availability for the listed dates
2. Capacity for ${weddingProfile.guestCount} guests
3. Pricing/package options
4. What's included (catering, decor, etc.)
5. Any site visit availability

Sign off as Monica.

Return JSON with exactly two keys: "subject" and "body". Body should be plain text (no markdown).`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    return JSON.parse(text)
  } catch {
    return {
      subject: `Wedding Venue Inquiry – ${weddingProfile.guestCount} Guests`,
      body: text,
    }
  }
}

export async function draftFollowUpEmail(venue: {
  name: string
  contactEmail: string
  originalSubject: string
  interested: boolean
}): Promise<{ subject: string; body: string }> {
  const prompt = `Draft a follow-up email for Monica's wedding venue search.

Venue: ${venue.name}
Original subject: ${venue.originalSubject}
Monica's interest level: ${venue.interested ? 'Interested — wants to move forward' : 'Not interested — politely declining'}

${venue.interested
  ? 'Express interest, ask about next steps (site visit, contract, deposit).'
  : 'Politely thank them and let them know we have decided to go in a different direction.'}

Sign off as Monica. Keep it concise and professional.
Return JSON with exactly two keys: "subject" and "body".`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    return JSON.parse(text)
  } catch {
    return { subject: `Re: ${venue.originalSubject}`, body: text }
  }
}
