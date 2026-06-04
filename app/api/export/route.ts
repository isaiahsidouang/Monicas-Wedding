import ExcelJS from 'exceljs'
import { knownVenues } from '@/lib/monica'
import type { VenueRecord, KnownVenue } from '@/types'

// ─── Region config ────────────────────────────────────────────────────────────
// All ARGB values are 8 chars (FF + RRGGBB)
const REGION_CFG: Record<string, { label: string; headerArgb: string; tabArgb: string; stripeArgb: string }> = {
  master:        { label: 'Venue Inquiries',       headerArgb: 'FF2C3E50', tabArgb: 'FF2C3E50', stripeArgb: 'FFF2F2F2' },
  illinois:      { label: 'Illinois',              headerArgb: 'FF3B6EA5', tabArgb: 'FF3B6EA5', stripeArgb: 'FFE8F0F8' },
  california:    { label: 'California',            headerArgb: 'FFD4643A', tabArgb: 'FFD4643A', stripeArgb: 'FFFDF0EB' },
  miami:         { label: 'Miami & South Florida', headerArgb: 'FF1E8A7B', tabArgb: 'FF1E8A7B', stripeArgb: 'FFE5F4F2' },
  'puerto-rico': { label: 'Puerto Rico',           headerArgb: 'FF3A8A40', tabArgb: 'FF3A8A40', stripeArgb: 'FFE9F5EA' },
  caribbean:     { label: 'Caribbean',             headerArgb: 'FF7B4EA8', tabArgb: 'FF7B4EA8', stripeArgb: 'FFF3EEF9' },
  other:         { label: 'Other',                 headerArgb: 'FF6E7E8A', tabArgb: 'FF6E7E8A', stripeArgb: 'FFF0F2F3' },
}

// ─── Status → fill color ──────────────────────────────────────────────────────
const STATUS_FILLS: Array<{ keywords: string[]; argb: string; bold?: boolean }> = [
  { keywords: ['booked', 'confirmed', 'selected', 'signed', 'contract'], argb: 'FFD4EDDA', bold: true },
  { keywords: ['declined', 'unavailable', 'not available', 'rejected', 'passed'], argb: 'FFFDE8E8' },
  { keywords: ['negotiat', 'proposal', 'offer'], argb: 'FFFFE0B2' },
  { keywords: ['toured', 'site visit', 'visit'], argb: 'FFE0F0FF' },
  { keywords: ['pending', 'interested', 'following', 'follow-up', 'follow up', 'waiting'], argb: 'FFFFF9DB' },
]

const PRIORITY_FILLS: Record<string, string> = {
  high: 'FFFDE8E8', medium: 'FFFFF9DB', low: 'FFE8F5E9',
}

// ─── Column definitions ────────────────────────────────────────────────────────
type RowShape = ReturnType<typeof toRow>
const COLUMNS: Array<{ header: string; key: keyof RowShape; width: number; wrap?: boolean }> = [
  { header: 'Venue / Vendor Name',   key: 'name',               width: 32 },
  { header: 'Contact Name',          key: 'contactName',        width: 20 },
  { header: 'Title',                 key: 'title',              width: 22 },
  { header: 'Phone',                 key: 'phone',              width: 18 },
  { header: 'Email',                 key: 'email',              width: 30 },
  { header: 'Website',               key: 'website',            width: 26 },
  { header: 'Available Date(s)',      key: 'availableDates',     width: 28 },
  { header: 'Unavailable Date(s)',    key: 'unavailableDates',   width: 28 },
  { header: 'Capacity (Seated)',      key: 'capacitySeated',     width: 18 },
  { header: 'Capacity (Reception)',   key: 'capacityReception',  width: 20 },
  { header: 'Venue Rental Fee',       key: 'venueRentalFee',     width: 18 },
  { header: 'F&B Minimum',           key: 'fbMinimum',          width: 16 },
  { header: 'Notes',                 key: 'notes',              width: 50, wrap: true },
  { header: 'Tour Scheduled?',       key: 'tourScheduled',      width: 16 },
  { header: 'Status',                key: 'status',             width: 24 },
  { header: 'Followed up',           key: 'followedUp',         width: 46, wrap: true },
  { header: 'Last Response Date',    key: 'lastResponseDate',   width: 18 },
  { header: 'Next Action',           key: 'nextAction',         width: 46, wrap: true },
  { header: 'Next Action Due Date',  key: 'nextActionDueDate',  width: 20 },
  { header: 'Priority',              key: 'priority',           width: 10 },
]

// STATUS_COL and PRIORITY_COL are 1-based column indices
const STATUS_COL   = COLUMNS.findIndex((c) => c.key === 'status') + 1
const PRIORITY_COL = COLUMNS.findIndex((c) => c.key === 'priority') + 1

function toRow(v: VenueRecord): Record<string, string> {
  return {
    name:              v.name,
    contactName:       v.contact.name || '',
    title:             v.contact.title || '',
    phone:             v.contact.phone || '',
    email:             v.contact.email || '',
    website:           v.contact.website || '',
    availableDates:    v.availableDates || '',
    unavailableDates:  v.unavailableDates || '',
    capacitySeated:    v.capacitySeated || '',
    capacityReception: v.capacityReception || '',
    venueRentalFee:    v.venueRentalFee || '',
    fbMinimum:         v.fbMinimum || '',
    notes:             v.notes || '',
    tourScheduled:     v.tourScheduled || '',
    status:            v.status || '',
    followedUp:        v.followedUp || '',
    lastResponseDate:  v.lastResponseDate || '',
    nextAction:        v.nextAction || '',
    nextActionDueDate: v.nextActionDueDate || '',
    priority:          v.priority || '',
  }
}

// KnownVenue region 'chicago' maps to VenueRecord region 'illinois'
const KNOWN_REGION_MAP: Record<KnownVenue['region'], VenueRecord['region']> = {
  california:    'california',
  chicago:       'illinois',
  miami:         'miami',
  'puerto-rico': 'puerto-rico',
  caribbean:     'caribbean',
}

function knownToRecord(kv: KnownVenue): VenueRecord {
  return {
    id:            kv.id,
    name:          kv.name,
    type:          'venue',
    region:        KNOWN_REGION_MAP[kv.region],
    contact: {
      email: kv.contactEmail || '',
      phone: kv.phone,
    },
    location:      kv.location,
    notes:         kv.description,
    isOceanfront:  kv.isOceanfront,
    status:        '',
    priority:      '',
    priorityScore: 7,
    analyzedAt:    new Date().toISOString(),
  }
}

// Merge: client-scanned/imported venues take precedence over known-venue base
function mergeVenues(clientVenues: VenueRecord[]): VenueRecord[] {
  const map = new Map<string, VenueRecord>()
  for (const kv of knownVenues) map.set(kv.name.toLowerCase(), knownToRecord(kv))
  for (const v of clientVenues)  map.set(v.name.toLowerCase(), v)
  return Array.from(map.values())
}

// ─── Sheet builder ─────────────────────────────────────────────────────────────
function addSheet(wb: ExcelJS.Workbook, regionKey: string, venues: VenueRecord[]) {
  if (venues.length === 0) return
  const cfg = REGION_CFG[regionKey] ?? REGION_CFG.other
  const ws  = wb.addWorksheet(cfg.label)

  ws.properties.tabColor = { argb: cfg.tabArgb }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }))

  // Header row styling
  const hdr = ws.getRow(1)
  hdr.height = 24
  hdr.eachCell((cell) => {
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: cfg.headerArgb } }
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border    = { bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } } }
  })

  // Data rows
  venues.forEach((venue, idx) => {
    const row = ws.addRow(toRow(venue))
    row.height = 20
    const bgArgb = idx % 2 === 0 ? 'FFFFFFFF' : cfg.stripeArgb

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } }
      cell.font      = { name: 'Calibri', size: 10 }
      cell.alignment = { vertical: 'middle', wrapText: COLUMNS[colNum - 1]?.wrap === true }
      cell.border    = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } }
    })

    // Status cell color
    const statusLower = (venue.status || '').toLowerCase()
    const statusMatch = STATUS_FILLS.find((e) => e.keywords.some((k) => statusLower.includes(k)))
    if (statusMatch) {
      const cell = row.getCell(STATUS_COL)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusMatch.argb } }
      if (statusMatch.bold) cell.font = { name: 'Calibri', size: 10, bold: true }
    }

    // Priority cell color
    const priArgb = PRIORITY_FILLS[(venue.priority || '').toLowerCase()]
    if (priArgb) {
      const cell = row.getCell(PRIORITY_COL)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: priArgb } }
      cell.font = { name: 'Calibri', size: 10, bold: true }
    }
  })
}

// ─── Route ────────────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  const { venues: clientVenues = [] }: { venues: VenueRecord[] } = await req.json()

  // Always start from the 19 pre-loaded known venues, then overlay scanned/imported data
  const allVenues = mergeVenues(clientVenues)

  const wb = new ExcelJS.Workbook()
  wb.creator = "Monica's Wedding Planner"
  wb.created = new Date()

  addSheet(wb, 'master', allVenues)

  const REGIONS = ['illinois', 'california', 'miami', 'puerto-rico', 'caribbean', 'other'] as const
  for (const region of REGIONS) {
    addSheet(wb, region, allVenues.filter((v) => v.region === region))
  }

  const buffer = await wb.xlsx.writeBuffer()
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="monica-wedding-venues.xlsx"',
    },
  })
}
