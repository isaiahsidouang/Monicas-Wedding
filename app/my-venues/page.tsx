'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Table2, Download, Search } from 'lucide-react'
import { loadFromDb, saveToDb } from '@/lib/db-client'
import type { VenueRecord } from '@/types'

const REGION_LABELS: Record<string, string> = {
  illinois: 'Illinois',
  california: 'California',
  'puerto-rico': 'Puerto Rico',
  caribbean: 'Caribbean',
  miami: 'Miami / South FL',
  other: 'Other',
}

const PRIORITY_COLORS: Record<string, string> = {
  High: '#c05470',
  Medium: '#c9874a',
  Low: '#3d8a56',
  '': 'var(--text-muted)',
}

export default function MyVenuesPage() {
  const { data: session } = useSession()
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [search, setSearch] = useState('')
  const [regionFilter, setRegionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastReplyFilter, setLastReplyFilter] = useState<'all' | 'vendor' | 'user'>('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('mw_venues')
    if (stored) setVenues(JSON.parse(stored))
    if (session) {
      loadFromDb('mw_venues').then(data => {
        if (data) { setVenues(data as VenueRecord[]); localStorage.setItem('mw_venues', JSON.stringify(data)) }
      })
    }
  }, [session])

  function updateVenue(id: string, patch: Partial<VenueRecord>) {
    const updated = venues.map((v) => v.id === id ? { ...v, ...patch } : v)
    setVenues(updated)
    localStorage.setItem('mw_venues', JSON.stringify(updated))
    if (session) saveToDb('mw_venues', updated)
  }

  const regions = ['all', ...Array.from(new Set(venues.map((v) => v.region || 'other').filter(Boolean)))]
  const statuses = ['all', ...Array.from(new Set(venues.map((v) => v.status).filter(Boolean)))]

  const filtered = venues.filter((v) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      (v.contact.email || '').toLowerCase().includes(q) ||
      (v.contact.name || '').toLowerCase().includes(q) ||
      (v.notes || '').toLowerCase().includes(q) ||
      (v.status || '').toLowerCase().includes(q)
    const matchRegion = regionFilter === 'all' || (v.region || 'other') === regionFilter
    const matchStatus = statusFilter === 'all' || v.status === statusFilter
    const matchReply = lastReplyFilter === 'all' || v.lastResponseFrom === lastReplyFilter
    return matchSearch && matchRegion && matchStatus && matchReply
  })

  async function handleExport() {
    if (venues.length === 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venues }),
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'monica-wedding-venues.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Export failed — try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Table2 size={18} style={{ color: 'var(--accent)' }} />
            My Venues
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {venues.length} venues tracked · imported from your spreadsheet
          </p>
        </div>
        <button
          onClick={handleExport}
          disabled={venues.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Download size={14} />
          {loading ? 'Exporting…' : 'Export to Excel'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search venues, contacts, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          />
        </div>
        <select
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">All Regions</option>
          {regions.filter((r) => r !== 'all').map((r) => (
            <option key={r} value={r}>{REGION_LABELS[r] || r}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">All Statuses</option>
          {statuses.filter((s) => s !== 'all').map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={lastReplyFilter}
          onChange={(e) => setLastReplyFilter(e.target.value as 'all' | 'vendor' | 'user')}
          className="px-3 py-2 rounded-lg text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value="all">Last Reply: All</option>
          <option value="vendor">Vendor replied last</option>
          <option value="user">Monica replied last</option>
        </select>
      </div>

      {/* Count */}
      {(search || regionFilter !== 'all' || statusFilter !== 'all') && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing {filtered.length} of {venues.length} venues
        </p>
      )}

      {/* Empty state */}
      {venues.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="font-medium">No venues loaded yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Go to the home page and import your Excel spreadsheet to see your venues here.
          </p>
        </div>
      )}

      {/* Table */}
      {filtered.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fdf2f4', borderBottom: '1px solid var(--border)' }}>
                  {['Venue / Vendor', 'Region', 'Contact', 'Status', 'Last Reply', 'Priority', 'Venue Fee', 'F&B Min', 'Available Dates', 'Next Action', 'Notes'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--accent)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((v, i) => (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                    }}
                  >
                    <td className="px-4 py-3 font-medium min-w-48 max-w-56">
                      <div className="truncate">{v.name}</div>
                      {v.contact.website && (
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{v.contact.website}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: 'var(--text-muted)' }}>
                      {REGION_LABELS[v.region || ''] || v.region || '—'}
                    </td>
                    <td className="px-4 py-3 min-w-40">
                      {v.contact.name && <div className="text-xs font-medium">{v.contact.name}</div>}
                      {v.contact.email && (
                        <a href={`mailto:${v.contact.email}`} className="text-xs underline" style={{ color: 'var(--accent)' }}>
                          {v.contact.email}
                        </a>
                      )}
                      {v.contact.phone && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.contact.phone}</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                        {v.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex gap-1">
                        {(['vendor', 'user'] as const).map((who) => (
                          <button
                            key={who}
                            onClick={() => updateVenue(v.id, {
                              lastResponseFrom: v.lastResponseFrom === who ? undefined : who,
                            })}
                            className="text-xs px-2 py-0.5 rounded-full transition-colors"
                            style={v.lastResponseFrom === who
                              ? { background: who === 'vendor' ? '#3d8a5620' : '#c054701a', color: who === 'vendor' ? '#3d8a56' : '#c05470', border: `1px solid ${who === 'vendor' ? '#3d8a56' : '#c05470'}` }
                              : { background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                            }
                            title={`Mark: ${who === 'vendor' ? 'Vendor' : 'Monica'} replied last`}
                          >
                            {who === 'vendor' ? 'Vendor' : 'Monica'}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold" style={{ color: PRIORITY_COLORS[v.priority] || 'var(--text-muted)' }}>
                      {v.priority || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{v.venueRentalFee || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">{v.fbMinimum || '—'}</td>
                    <td className="px-4 py-3 text-xs min-w-36 max-w-44">
                      <div className="truncate">{v.availableDates || '—'}</div>
                    </td>
                    <td className="px-4 py-3 text-xs min-w-36 max-w-44">
                      <div className="truncate">{v.nextAction || '—'}</div>
                      {v.nextActionDueDate && (
                        <div style={{ color: 'var(--text-muted)' }}>{v.nextActionDueDate}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs min-w-44 max-w-56">
                      <div className="truncate" title={v.notes}>{v.notes || '—'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
