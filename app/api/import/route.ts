import * as XLSX from 'xlsx'
import type { VenueRecord } from '@/types'

const SKIP_SHEETS = ['legend', '🗝️', 'packages', 'package']

// Sheets whose name signals they are a master/summary (processed last as fallback)
const MASTER_SHEET_KEYWORDS = ['venue inquiries', 'all venues', 'all regions', 'master', 'summary']

function isMasterSheet(name: string) {
  const lower = name.toLowerCase()
  return MASTER_SHEET_KEYWORDS.some((k) => lower.includes(k))
}

function sheetToRegion(sheetName: string): VenueRecord['region'] {
  const lower = sheetName.toLowerCase()
  if (lower.includes('illinois') || lower.includes('chicago'))                                        return 'illinois'
  if (lower.includes('california') || lower.includes('los angeles') || lower.includes('san francisco')) return 'california'
  if (lower.includes('miami') || lower.includes('south florida') || lower.includes('florida'))         return 'miami'
  if (lower.includes('puerto rico'))                                                                    return 'puerto-rico'
  if (lower.includes('caribbean') || lower.includes('virgin islands') || lower.includes('cayman') ||
      lower.includes('aruba') || lower.includes('bermuda') || lower.includes('bahamas') ||
      lower.includes('turks') || lower.includes('antigua') || lower.includes('barbados'))              return 'caribbean'
  return 'other'
}

function inferRegionFromLocation(location: string): VenueRecord['region'] {
  const loc = location.toLowerCase()
  if (loc.includes('california') || loc.includes(', ca') || loc.includes('san francisco') ||
      loc.includes('los angeles') || loc.includes('dana point') || loc.includes('half moon bay') ||
      loc.includes('rancho mirage'))                                                                    return 'california'
  if (loc.includes('chicago') || loc.includes('illinois') || loc.includes(', il'))                    return 'illinois'
  if (loc.includes('miami') || loc.includes('florida') || loc.includes(', fl') ||
      loc.includes('fort lauderdale') || loc.includes('bal harbour') || loc.includes('coconut grove')) return 'miami'
  if (loc.includes('puerto rico') || loc.includes('san juan') || loc.includes('dorado') ||
      loc.includes('río grande') || loc.includes('rio grande'))                                        return 'puerto-rico'
  if (loc.includes('caribbean') || loc.includes('cayman') || loc.includes('aruba') ||
      loc.includes('bermuda') || loc.includes('bahamas') || loc.includes('turks') ||
      loc.includes('virgin islands') || loc.includes('antigua') || loc.includes('barbados') ||
      loc.includes('saint') || loc.includes('st.'))                                                    return 'caribbean'
  return 'other'
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return Response.json({ error: 'No file provided' }, { status: 400 })

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const venues: VenueRecord[] = []
  const seen = new Set<string>()

  // Process regional sheets first so they get correct regions.
  // Master/summary sheets run last — any venue already seen is skipped,
  // so nothing gets incorrectly dumped into "other".
  const allSheets = wb.SheetNames.filter((n) => !SKIP_SHEETS.some((s) => n.toLowerCase().includes(s)))
  const regionalSheets = allSheets.filter((n) => !isMasterSheet(n))
  const masterSheets   = allSheets.filter((n) => isMasterSheet(n))
  const orderedSheets  = [...regionalSheets, ...masterSheets]

  for (const sheetName of orderedSheets) {
    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string>[]
    const regionFromSheet = isMasterSheet(sheetName) ? null : sheetToRegion(sheetName)

    for (const row of rows) {
      const name = row['Venue / Vendor Name'] || row['Venue/Vendor Name'] || ''
      if (!name || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())

      const location = row['Location'] || row['City'] || ''
      const region: VenueRecord['region'] =
        regionFromSheet ?? inferRegionFromLocation(location)

      venues.push({
        id: crypto.randomUUID(),
        name,
        type: 'venue',
        region,
        contact: {
          name:    row['Contact Name'] || undefined,
          title:   row['Title'] || undefined,
          email:   row['Email'] || '',
          phone:   row['Phone'] || undefined,
          website: row['Website'] || undefined,
        },
        location,
        capacitySeated:    row['Capacity (Seated)']    ? String(row['Capacity (Seated)'])    : undefined,
        capacityReception: row['Capacity (Reception)'] ? String(row['Capacity (Reception)']) : undefined,
        venueRentalFee:    row['Venue Rental Fee'] || undefined,
        fbMinimum:         row['F&B Minimum'] || undefined,
        availableDates:    row['Available Date(s)'] || undefined,
        unavailableDates:  row['Unavailable Date(s)'] || undefined,
        status:            row['Status'] || 'new',
        priority:          (row['Priority'] as VenueRecord['priority']) || '',
        tourScheduled:     row['Tour Scheduled?'] || undefined,
        followedUp:        row['Followed up'] || undefined,
        lastResponseDate:  row['Last Response Date'] || undefined,
        nextAction:        row['Next Action'] || undefined,
        nextActionDueDate: row['Next Action Due Date'] || undefined,
        notes:             row['Notes'] || undefined,
        priorityScore:     row['Priority'] === 'High' ? 8 : row['Priority'] === 'Medium' ? 5 : 3,
        analyzedAt:        new Date().toISOString(),
        importedFromExcel: true,
      })
    }
  }

  return Response.json({ venues, count: venues.length })
}
