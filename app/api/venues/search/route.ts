import Anthropic from '@anthropic-ai/sdk'
import { knownVenues, weddingProfile } from '@/lib/monica'
import type { KnownVenue } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const REGION_LABELS: Record<string, string> = {
  california:          'California (Los Angeles area)',
  'california-sd':     'California (San Diego area)',
  'california-napa':   'California (Napa Valley / Wine Country)',
  'california-sb':     'California (Santa Barbara)',
  'california-sf':     'California (San Francisco Bay Area)',
  'california-palm':   'California (Palm Springs / Coachella Valley)',
  chicago:             'Chicago, Illinois',
  miami:               'Miami and South Florida',
  'florida-keys':      'Florida Keys',
  'new-york':          'New York City (Manhattan)',
  'new-england':       'New England (Boston, Newport RI)',
  'new-orleans':       'New Orleans, Louisiana',
  nashville:           'Nashville, Tennessee',
  'las-vegas':         'Las Vegas, Nevada',
  scottsdale:          'Scottsdale, Arizona',
  hawaii:              'Hawaii (Maui)',
  'hawaii-oahu':       'Hawaii (Oahu / Big Island)',
  'puerto-rico':       'Puerto Rico',
  usvi:                'US Virgin Islands (St. Thomas, St. John, St. Croix)',
  caribbean:           'Grand Cayman',
  'caribbean-aruba':   'Aruba',
  'caribbean-bda':     'Bermuda',
  'caribbean-tc':      'Turks & Caicos',
  'caribbean-bds':     'Barbados',
  'caribbean-sl':      'St. Lucia',
  'caribbean-ant':     'Antigua',
}

// Maps search filter value → KnownVenue region value
const REGION_TO_VENUE: Record<string, KnownVenue['region']> = {
  california:          'california',
  'california-sd':     'california',
  'california-napa':   'california',
  'california-sb':     'california',
  'california-sf':     'california',
  'california-palm':   'california',
  chicago:             'chicago',
  miami:               'miami',
  'florida-keys':      'florida-keys',
  'new-york':          'new-york',
  'new-england':       'new-england',
  'new-orleans':       'new-orleans',
  nashville:           'nashville',
  'las-vegas':         'las-vegas',
  scottsdale:          'scottsdale',
  hawaii:              'hawaii',
  'hawaii-oahu':       'hawaii',
  'puerto-rico':       'puerto-rico',
  usvi:                'usvi',
  caribbean:           'caribbean',
  'caribbean-aruba':   'caribbean',
  'caribbean-bda':     'caribbean',
  'caribbean-tc':      'caribbean',
  'caribbean-bds':     'caribbean',
  'caribbean-sl':      'caribbean',
  'caribbean-ant':     'caribbean',
}

const SETTING_LABELS: Record<string, string> = {
  oceanfront: 'oceanfront / beachfront only',
  city:       'city hotels with grand ballrooms',
  resort:     'resort or private estate properties',
  garden:     'garden or outdoor venues',
  rooftop:    'rooftop venues',
  historic:   'historic or landmark properties',
  vineyard:   'vineyard or winery venues',
  island:     'private island resort properties',
  mountain:   'mountain or scenic view venues',
  villa:      'private villa or villa estate',
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const regionStr   = searchParams.get('region')   || ''
  const brandStr    = searchParams.get('brand')     || ''
  const settingStr  = searchParams.get('setting')   || ''
  const capacityStr = searchParams.get('capacity')  || ''

  const regions    = regionStr   ? regionStr.split(',').filter(Boolean)   : []
  const brands     = brandStr    ? brandStr.split(',').filter(Boolean)    : []
  const settings   = settingStr  ? settingStr.split(',').filter(Boolean)  : []
  const capacities = capacityStr ? capacityStr.split(',').filter(Boolean) : []

  const existingNames = knownVenues.map(v => v.name.toLowerCase())

  const regionText = regions.length === 0
    ? 'California, Chicago, Miami/South Florida, Puerto Rico, and Caribbean islands'
    : regions.map(r => REGION_LABELS[r] ?? r).join('; ')

  const brandText = brands.length === 0
    ? `any luxury brand — prioritize: ${weddingProfile.preferredBrands.join(', ')}, Waldorf Astoria, EDITION, W Hotels, Mandarin Oriental, Conrad, Park Hyatt, Auberge Resorts, Montage`
    : `specifically these brands: ${brands.join(', ')}`

  const settingText = settings.length === 0
    ? 'any setting (oceanfront, city, or resort)'
    : settings.map(s => SETTING_LABELS[s] ?? s).join('; or ')

  const minCapacity = capacities.length === 0
    ? 350
    : Math.min(...capacities.map(c => parseInt(c) || 350))

  const validVenueRegions = regions.length === 0
    ? '"california" | "chicago" | "miami" | "florida-keys" | "new-york" | "new-england" | "puerto-rico" | "usvi" | "caribbean" | "hawaii" | "las-vegas" | "nashville" | "new-orleans" | "scottsdale" | "other"'
    : [...new Set(regions.map(r => `"${REGION_TO_VENUE[r] ?? 'other'}"`))]
        .join(' | ')

  const prompt = `You are a luxury wedding venue specialist. Find real existing 5-star venues for Monica's wedding.

Search criteria for this query:
- Regions: ${regionText}
- Brand preference: ${brandText}
- Setting: ${settingText}
- Minimum capacity: ${minCapacity}+ guests seated
- Max venue rental budget: $${weddingProfile.budgetMax.toLocaleString()}
- Must be 5-star / ultra-luxury tier only
- No venues in Mexico

Venues Monica already has — exclude these entirely:
${knownVenues.map(v => `- ${v.name}`).join('\n')}

Find 10–14 new venues matching the criteria. Be specific and accurate — only real properties that genuinely exist.

Return ONLY a valid JSON array, no explanation, no markdown. Each item:
{
  "name": "official full venue name",
  "brand": "hotel brand or Luxury Independent",
  "location": "City, State or Island",
  "region": ${validVenueRegions},
  "capacity": "350+" or "400+" etc,
  "isOceanfront": true | false,
  "contactEmail": "wedding or events email if you know it — omit if unsure",
  "phone": "phone number if you know it — omit if unsure",
  "description": "1–2 sentences on why this works for a ${minCapacity}+ guest luxury wedding"
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
        region:       (v.region as KnownVenue['region']) || 'other',
        capacity:     (v.capacity as string) || `${minCapacity}+`,
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
