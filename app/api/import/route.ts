import * as XLSX from 'xlsx'
import type { VenueRecord } from '@/types'

const REGION_MAP: Record<string, VenueRecord['region']> = {
  'illinois': 'illinois',
  'california': 'california',
  'puerto rico': 'puerto-rico',
  'caribbean': 'caribbean',
  'u.s. virgin islands': 'caribbean',
  'miami': 'miami',
  'miami & south florida': 'miami',
  'florida': 'miami',
}

function sheetToRegion(sheetName: string): VenueRecord['region'] {
  const lower = sheetName.toLowerCase()
  for (const [key, val] of Object.entries(REGION_MAP)) {
    if (lower.includes(key)) return val
  }
  return 'other'
}

export async function POST(req: Request) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return Response.json({ error: 'No file provided' }, { status: 400 })
  }

  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(buffer, { type: 'array' })

  const venues: VenueRecord[] = []
  const seen = new Set<string>()

  const SKIP_SHEETS = ['legend', '🗝️', 'packages', 'package']

  for (const sheetName of wb.SheetNames) {
    const lower = sheetName.toLowerCase()
    if (SKIP_SHEETS.some((s) => lower.includes(s))) continue

    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, string>[]
    const region = sheetToRegion(sheetName)

    for (const row of rows) {
      const name = row['Venue / Vendor Name'] || row['Venue/Vendor Name'] || ''
      if (!name || seen.has(name.toLowerCase())) continue
      seen.add(name.toLowerCase())

      venues.push({
        id: crypto.randomUUID(),
        name,
        type: 'venue',
        region,
        contact: {
          name: row['Contact Name'] || undefined,
          title: row['Title'] || undefined,
          email: row['Email'] || '',
          phone: row['Phone'] || undefined,
          website: row['Website'] || undefined,
        },
        location: region ? region.replace('-', ' ') : '',
        capacitySeated: row['Capacity (Seated)'] ? String(row['Capacity (Seated)']) : undefined,
        capacityReception: row['Capacity (Reception)'] ? String(row['Capacity (Reception)']) : undefined,
        venueRentalFee: row['Venue Rental Fee'] || undefined,
        fbMinimum: row['F&B Minimum'] || undefined,
        availableDates: row['Available Date(s)'] || undefined,
        unavailableDates: row['Unavailable Date(s)'] || undefined,
        status: row['Status'] || 'new',
        priority: (row['Priority'] as VenueRecord['priority']) || '',
        tourScheduled: row['Tour Scheduled?'] || undefined,
        followedUp: row['Followed up'] || undefined,
        lastResponseDate: row['Last Response Date'] || undefined,
        nextAction: row['Next Action'] || undefined,
        nextActionDueDate: row['Next Action Due Date'] || undefined,
        notes: row['Notes'] || undefined,
        priorityScore: row['Priority'] === 'High' ? 8 : row['Priority'] === 'Medium' ? 5 : 3,
        analyzedAt: new Date().toISOString(),
        importedFromExcel: true,
      })
    }
  }

  return Response.json({ venues, count: venues.length })
}
