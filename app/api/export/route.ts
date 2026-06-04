import ExcelJS from 'exceljs'
import type { VenueRecord } from '@/types'

// ARGB colors per region
const REGION_CONFIG: Record<string, { label: string; headerArgb: string; tabArgb: string; stripeArgb: string }> = {
  master:        { label: 'Venue Inquiries',      headerArgb: 'FF2C3E50', tabArgb: '2C3E50', stripeArgb: 'FFF2F2F2' },
  illinois:      { label: 'Illinois',             headerArgb: 'FF3B6EA5', tabArgb: '3B6EA5', stripeArgb: 'FFE8F0F8' },
  california:    { label: 'California',           headerArgb: 'FFD4643A', tabArgb: 'D4643A', stripeArgb: 'FFFDF0EB' },
  miami:         { label: 'Miami & South Florida', headerArgb: 'FF1E8A7B', tabArgb: '1E8A7B', stripeArgb: 'FFE5F4F2' },
  'puerto-rico': { label: 'Puerto Rico',          headerArgb: 'FF3A8A40', tabArgb: '3A8A40', stripeArgb: 'FFE9F5EA' },
  caribbean:     { label: 'Caribbean',            headerArgb: 'FF7B4EA8', tabArgb: '7B4EA8', stripeArgb: 'FFF3EEF9' },
  other:         { label: 'Other',                headerArgb: 'FF6E7E8A', tabArgb: '6E7E8A', stripeArgb: 'FFF0F2F3' },
}

// Status keyword → background fill (ARGB)
const STATUS_FILLS: Array<{ keywords: string[]; argb: string; bold?: boolean }> = [
  { keywords: ['booked', 'confirmed', 'selected', 'signed', 'contract'], argb: 'FFD4EDDA', bold: true },
  { keywords: ['declined', 'unavailable', 'not available', 'rejected', 'passed'], argb: 'FFFDE8E8' },
  { keywords: ['negotiat', 'proposal', 'offer'], argb: 'FFFFE0B2' },
  { keywords: ['toured', 'visit', 'site visit'], argb: 'FFE0F0FF' },
  { keywords: ['pending', 'interested', 'following', 'follow-up', 'follow up', 'waiting'], argb: 'FFFFF9DB' },
]

const PRIORITY_FILLS: Record<string, string> = {
  high: 'FFFDE8E8',
  medium: 'FFFFF9DB',
  low: 'FFE8F5E9',
}

const COLUMNS: Array<{ header: string; key: keyof ReturnType<typeof toRow>; width: number; wrap?: boolean }> = [
  { header: 'Venue / Vendor Name',    key: 'name',               width: 32 },
  { header: 'Contact Name',           key: 'contactName',        width: 20 },
  { header: 'Title',                  key: 'title',              width: 22 },
  { header: 'Phone',                  key: 'phone',              width: 18 },
  { header: 'Email',                  key: 'email',              width: 30 },
  { header: 'Website',                key: 'website',            width: 26 },
  { header: 'Available Date(s)',       key: 'availableDates',     width: 28 },
  { header: 'Unavailable Date(s)',     key: 'unavailableDates',   width: 28 },
  { header: 'Capacity (Seated)',       key: 'capacitySeated',     width: 18 },
  { header: 'Capacity (Reception)',    key: 'capacityReception',  width: 20 },
  { header: 'Venue Rental Fee',        key: 'venueRentalFee',     width: 18 },
  { header: 'F&B Minimum',            key: 'fbMinimum',          width: 16 },
  { header: 'Notes',                  key: 'notes',              width: 50, wrap: true },
  { header: 'Tour Scheduled?',        key: 'tourScheduled',      width: 16 },
  { header: 'Status',                 key: 'status',             width: 24 },
  { header: 'Followed up',            key: 'followedUp',         width: 46, wrap: true },
  { header: 'Last Response Date',     key: 'lastResponseDate',   width: 18 },
  { header: 'Next Action',            key: 'nextAction',         width: 46, wrap: true },
  { header: 'Next Action Due Date',   key: 'nextActionDueDate',  width: 20 },
  { header: 'Priority',              key: 'priority',            width: 10 },
]

function toRow(v: VenueRecord) {
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

function getStatusFill(status: string) {
  const lower = status.toLowerCase()
  for (const entry of STATUS_FILLS) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry
  }
  return null
}

function addSheet(wb: ExcelJS.Workbook, regionKey: string, venues: VenueRecord[]) {
  if (venues.length === 0) return
  const cfg = REGION_CONFIG[regionKey] ?? REGION_CONFIG.other

  const ws = wb.addWorksheet(cfg.label)
  ws.properties.tabColor = { argb: cfg.tabArgb }
  ws.views = [{ state: 'frozen', ySplit: 1 }]

  ws.columns = COLUMNS.map((c) => ({ header: c.header, key: c.key, width: c.width }))

  // Style header row
  const headerRow = ws.getRow(1)
  headerRow.height = 24
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: cfg.headerArgb } }
    cell.font  = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11, name: 'Calibri' }
    cell.alignment = { vertical: 'middle', horizontal: 'left' }
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFFFFFFF' } } }
  })

  // Data rows
  venues.forEach((venue, idx) => {
    const row = ws.addRow(toRow(venue))
    row.height = 20
    const isEven = idx % 2 === 0

    row.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : cfg.stripeArgb },
      }
      cell.font = { name: 'Calibri', size: 10 }
      cell.alignment = {
        vertical: 'middle',
        wrapText: COLUMNS[colNum - 1]?.wrap === true,
      }
      cell.border = { bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } } }
    })

    // Status color (col 15)
    const statusEntry = getStatusFill(venue.status || '')
    if (statusEntry) {
      const cell = row.getCell(15)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusEntry.argb } }
      if (statusEntry.bold) cell.font = { name: 'Calibri', size: 10, bold: true }
    }

    // Priority color (col 20)
    const pri = (venue.priority || '').toLowerCase()
    if (PRIORITY_FILLS[pri]) {
      const cell = row.getCell(20)
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: PRIORITY_FILLS[pri] } }
      cell.font = { name: 'Calibri', size: 10, bold: true }
    }
  })
}

export async function POST(req: Request) {
  const { venues }: { venues: VenueRecord[] } = await req.json()

  const wb = new ExcelJS.Workbook()
  wb.creator = "Monica's Wedding Planner"
  wb.created = new Date()

  // Master sheet (all venues)
  addSheet(wb, 'master', venues)

  // Regional sheets — only if they have venues
  const REGION_ORDER = ['illinois', 'california', 'miami', 'puerto-rico', 'caribbean', 'other'] as const
  for (const region of REGION_ORDER) {
    addSheet(wb, region, venues.filter((v) => v.region === region))
  }

  const buffer = await wb.xlsx.writeBuffer()

  return new Response(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="monica-wedding-venues.xlsx"',
    },
  })
}
