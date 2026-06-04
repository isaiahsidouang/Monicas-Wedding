import { auth } from '@/auth'
import * as XLSX from 'xlsx'
import type { VenueRecord } from '@/types'

const REGION_SHEET_NAMES: Record<string, string> = {
  illinois: 'Illinois',
  california: 'California',
  'puerto-rico': 'Puerto Rico',
  caribbean: 'Caribbean',
  miami: 'Miami & South Florida',
  other: 'Other',
}

function toRow(v: VenueRecord) {
  return {
    'Venue / Vendor Name': v.name,
    'Contact Name': v.contact.name || '',
    'Title': v.contact.title || '',
    'Phone': v.contact.phone || '',
    'Email': v.contact.email || '',
    'Website': v.contact.website || '',
    'Available Date(s)': v.availableDates || '',
    'Unavailable Date(s)': v.unavailableDates || '',
    'Capacity (Seated)': v.capacitySeated || '',
    'Capacity (Reception)': v.capacityReception || '',
    'Venue Rental Fee': v.venueRentalFee || '',
    'F&B Minimum': v.fbMinimum || '',
    'Notes': v.notes || '',
    'Tour Scheduled?': v.tourScheduled || 'No',
    'Status': v.status || '',
    'Followed up': v.followedUp || '',
    'Last Response Date': v.lastResponseDate || '',
    'Next Action': v.nextAction || '',
    'Next Action Due Date': v.nextActionDueDate || '',
    'Priority': v.priority || '',
  }
}

function addSheet(wb: XLSX.WorkBook, name: string, rows: ReturnType<typeof toRow>[]) {
  if (rows.length === 0) return
  const ws = XLSX.utils.json_to_sheet(rows)
  const colWidths = [
    { wch: 30 }, // Venue Name
    { wch: 20 }, // Contact Name
    { wch: 25 }, // Title
    { wch: 20 }, // Phone
    { wch: 30 }, // Email
    { wch: 25 }, // Website
    { wch: 30 }, // Available Dates
    { wch: 30 }, // Unavailable Dates
    { wch: 20 }, // Capacity Seated
    { wch: 20 }, // Capacity Reception
    { wch: 20 }, // Rental Fee
    { wch: 20 }, // F&B Minimum
    { wch: 50 }, // Notes
    { wch: 15 }, // Tour Scheduled
    { wch: 20 }, // Status
    { wch: 50 }, // Followed up
    { wch: 18 }, // Last Response Date
    { wch: 50 }, // Next Action
    { wch: 18 }, // Next Action Due Date
    { wch: 10 }, // Priority
  ]
  ws['!cols'] = colWidths
  XLSX.utils.book_append_sheet(wb, ws, name)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { venues }: { venues: VenueRecord[] } = await req.json()

  const wb = XLSX.utils.book_new()

  // Master sheet — all venues
  addSheet(wb, 'Venue Inquiries', venues.map(toRow))

  // Regional sheets
  const regions = ['illinois', 'california', 'puerto-rico', 'caribbean', 'miami', 'other'] as const
  for (const region of regions) {
    const regionVenues = venues.filter((v) => v.region === region)
    if (regionVenues.length > 0) {
      addSheet(wb, REGION_SHEET_NAMES[region], regionVenues.map(toRow))
    }
  }

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="monica-wedding-venues.xlsx"',
    },
  })
}
