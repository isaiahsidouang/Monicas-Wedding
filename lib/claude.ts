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

export async function analyzeEmails(emails: RawEmail[]): Promise<VenueRecord[]> {
  const prompt = `You are helping Monica plan her wedding. Analyze these emails and extract venue/vendor information.

Monica's requirements:
- Guest count: ~${weddingProfile.guestCount}
- Budget: $${weddingProfile.budgetMax.toLocaleString()} max for venue
- Locations: California, Chicago, Miami/South Florida, Puerto Rico, Caribbean
- Preferred brands: ${weddingProfile.preferredBrands.join(', ')}
- US dates: ${weddingProfile.usDates.join('; ')}
- Caribbean/PR dates: ${weddingProfile.caribbeanDates.join('; ')}
- NO venues in Mexico, no 3-star or lower
- Caribbean venues must be oceanfront

For each email, extract and return a JSON array of venue/vendor records. Each record should have:
- name: venue or vendor name
- type: "venue" | "vendor" | "unknown"
- contact.email: sender email
- contact.name: sender name if visible
- contact.phone: phone number if mentioned
- location: city, state/country
- pricing: any pricing mentioned
- capacity: max guests if mentioned
- availability: any dates mentioned
- amenities: array of key features/amenities mentioned
- pros: positive aspects
- cons: concerns or negatives
- notes: any other relevant info
- priorityScore: 1-10 based on fit with Monica's requirements (10 = perfect match)
- isOceanfront: true/false if relevant
- tier: luxury tier estimate

Emails to analyze:
${emails.map((e, i) => `--- Email ${i + 1} ---
Subject: ${e.subject}
From: ${e.from}
Date: ${e.date}
Body: ${e.body.slice(0, 2000)}`).join('\n\n')}

Return ONLY a valid JSON array of venue records. No markdown, no explanation.`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  try {
    const parsed = JSON.parse(text)
    return parsed.map((v: Partial<VenueRecord>, i: number) => {
      const location = v.location || ''
      return {
        id: emails[i]?.id || crypto.randomUUID(),
        name: v.name || 'Unknown',
        type: v.type || 'unknown',
        region: inferRegion(location),
        contact: v.contact || { email: '' },
        location,
        venueRentalFee: v.venueRentalFee,
        capacitySeated: v.capacitySeated,
        capacityReception: v.capacityReception,
        availableDates: v.availableDates,
        amenities: v.amenities || [],
        pros: v.pros || [],
        cons: v.cons || [],
        notes: v.notes,
        priorityScore: v.priorityScore || 5,
        priority: v.priority || '',
        status: 'new',
        emailSubject: emails[i]?.subject,
        emailDate: emails[i]?.date,
        gmailThreadId: emails[i]?.threadId,
        isOceanfront: v.isOceanfront,
        tier: v.tier,
        analyzedAt: new Date().toISOString(),
      }
    })
  } catch {
    return []
  }
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
