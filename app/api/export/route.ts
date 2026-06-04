import { auth } from '@/auth'
import * as XLSX from 'xlsx'
import type { VenueRecord } from '@/types'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { venues }: { venues: VenueRecord[] } = await req.json()

  const rows = venues.map((v) => ({
    'Venue / Vendor': v.name,
    Type: v.type,
    Location: v.location,
    'Contact Email': v.contact.email,
    'Contact Name': v.contact.name || '',
    'Contact Phone': v.contact.phone || '',
    'Priority Score': v.priorityScore,
    Status: v.status,
    Pricing: v.pricing || '',
    Capacity: v.capacity || '',
    Availability: v.availability || '',
    Oceanfront: v.isOceanfront ? 'Yes' : '',
    Tier: v.tier || '',
    Pros: (v.pros || []).join('; '),
    Cons: (v.cons || []).join('; '),
    Amenities: (v.amenities || []).join('; '),
    Notes: v.notes || '',
    'Email Subject': v.emailSubject || '',
    'Email Date': v.emailDate || '',
    'Analyzed At': v.analyzedAt,
  }))

  const ws = XLSX.utils.json_to_sheet(rows)

  // Auto-width columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => ({
    wch: Math.max(key.length, 20),
  }))
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Venues & Vendors')

  const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="monica-wedding-venues.xlsx"',
    },
  })
}
