import Anthropic from '@anthropic-ai/sdk'
import { knownVenues, weddingProfile } from '@/lib/monica'
import type { KnownVenue } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function GET() {
  const existingNames = knownVenues.map(v => v.name.toLowerCase())

  const prompt = `You are a luxury wedding venue specialist. Find real, existing 5-star venues for Monica's wedding.

Monica's requirements:
- ~${weddingProfile.guestCount} guests (must seat at least 350)
- Max venue rental: $${weddingProfile.budgetMax.toLocaleString()}
- Brands she prefers: ${weddingProfile.preferredBrands.join(', ')}
- Target regions: California, Chicago, Miami/South Florida, Puerto Rico, Caribbean islands
- Caribbean and Puerto Rico MUST be oceanfront — no exceptions
- No Mexico, no properties below 5-star luxury
- Must have genuine wedding/event experience for large groups

Venues Monica already has (exclude these entirely):
${knownVenues.map(v => `- ${v.name}`).join('\n')}

Find 12–16 new venues she hasn't contacted. Prioritize:
- Four Seasons in CA, Chicago, Miami/South FL
- Rosewood properties in any target region
- Aman resorts in Caribbean/PR
- EDITION Hotels with 350+ event capacity
- Waldorf Astoria properties in target regions
- Independent ultra-luxury resorts and estates
- Any other proven 5-star property with 350+ seated capacity

Return ONLY a valid JSON array — no explanation, no markdown. Each item:
{
  "name": "official full venue name",
  "brand": "brand name (e.g. Four Seasons, Rosewood, Aman, or Luxury Independent)",
  "location": "City, State or Island",
  "region": "california" | "chicago" | "miami" | "puerto-rico" | "caribbean",
  "capacity": "350+" or "400+" etc,
  "isOceanfront": true | false,
  "contactEmail": "wedding or events email if known, omit if unsure",
  "phone": "phone number if known, omit if unsure",
  "description": "1–2 sentences on why this works for a 350-person luxury wedding"
}

Only include venues that genuinely exist. Be specific and accurate.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const raw: Array<Record<string, unknown>> = JSON.parse(clean)

    const venues: KnownVenue[] = raw
      .filter(v => typeof v.name === 'string' && v.name.length > 0)
      .filter(v => !existingNames.includes((v.name as string).toLowerCase()))
      .map((v, i) => ({
        id: `ai-${Date.now()}-${i}`,
        name:         v.name as string,
        brand:        (v.brand as string) || 'Luxury',
        location:     (v.location as string) || '',
        region:       (v.region as KnownVenue['region']) || 'california',
        capacity:     (v.capacity as string) || '350+',
        isOceanfront: Boolean(v.isOceanfront),
        contactEmail: v.contactEmail as string | undefined,
        phone:        v.phone as string | undefined,
        description:  (v.description as string) || '',
        discovered:   true,
      }))

    return Response.json({ venues, count: venues.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
