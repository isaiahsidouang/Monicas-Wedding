import Anthropic from '@anthropic-ai/sdk'
import { knownVenues, weddingProfile } from '@/lib/monica'
import type { KnownVenue } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const REGION_LABELS: Record<string, string> = {
  all:          'California, Chicago, Miami/South Florida, Puerto Rico, and Caribbean islands',
  california:   'California',
  chicago:      'Chicago, Illinois',
  miami:        'Miami and South Florida',
  'puerto-rico':'Puerto Rico',
  caribbean:    'Caribbean islands (Grand Cayman, Aruba, Bermuda, Turks & Caicos, Barbados, St. Lucia, Antigua, etc.)',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const region   = searchParams.get('region')   || 'all'
  const brand    = searchParams.get('brand')     || 'any'
  const setting  = searchParams.get('setting')   || 'any'
  const capacity = searchParams.get('capacity')  || '350'

  const existingNames = knownVenues.map(v => v.name.toLowerCase())

  // Build targeted description of what to search for
  const regionText   = REGION_LABELS[region] ?? REGION_LABELS['all']
  const brandText    = brand === 'any'
    ? `any of: ${weddingProfile.preferredBrands.join(', ')}, Waldorf Astoria, EDITION, W Hotels, Mandarin Oriental, Conrad`
    : brand
  const settingText  = setting === 'oceanfront' ? 'oceanfront / beachfront only — no exceptions'
    : setting === 'city'    ? 'city hotels with grand ballrooms (not required to be waterfront)'
    : setting === 'resort'  ? 'resort or private estate properties'
    : 'any setting (oceanfront, city, or resort)'
  const capacityText = `${capacity}+ guests seated`

  const prompt = `You are a luxury wedding venue specialist. Find real existing 5-star venues for Monica's wedding.

Search criteria for this query:
- Region: ${regionText}
- Brand preference: ${brandText}
- Setting: ${settingText}
- Minimum capacity: ${capacityText}
- Max venue rental budget: $${weddingProfile.budgetMax.toLocaleString()}
- Must be 5-star / ultra-luxury tier only
- No venues in Mexico

Venues Monica already has — exclude these entirely:
${knownVenues.map(v => `- ${v.name}`).join('\n')}

Find 10–14 new venues that match the search criteria above and that Monica hasn't already contacted. Be specific and accurate — only include real properties that genuinely exist.

Return ONLY a valid JSON array, no explanation, no markdown. Each item:
{
  "name": "official full venue name",
  "brand": "hotel brand or Luxury Independent",
  "location": "City, State or Island",
  "region": "california" | "chicago" | "miami" | "puerto-rico" | "caribbean",
  "capacity": "350+" or "400+" etc,
  "isOceanfront": true | false,
  "contactEmail": "wedding or events email if you know it — omit if unsure",
  "phone": "phone number if you know it — omit if unsure",
  "description": "1–2 sentences on why this works for a ${capacity}+ guest luxury wedding"
}`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text  = response.content[0].type === 'text' ? response.content[0].text : ''
    const clean = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
    const raw: Array<Record<string, unknown>> = JSON.parse(clean)

    const venues: KnownVenue[] = raw
      .filter(v => typeof v.name === 'string' && v.name.length > 0)
      .filter(v => !existingNames.includes((v.name as string).toLowerCase()))
      .map((v, i) => ({
        id:           `ai-${Date.now()}-${i}`,
        name:         v.name as string,
        brand:        (v.brand as string) || 'Luxury',
        location:     (v.location as string) || '',
        region:       (v.region as KnownVenue['region']) || 'california',
        capacity:     (v.capacity as string) || `${capacity}+`,
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
