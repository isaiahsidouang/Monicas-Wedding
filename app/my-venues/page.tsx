'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Table2, Download, Search, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
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

const PRIORITY_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2, '': 3 }
const PRIORITY_COLORS: Record<string, string> = {
  High: '#c05470',
  Medium: '#c9874a',
  Low: '#3d8a56',
  '': 'var(--text-muted)',
}

type SortCol =
  | 'name' | 'region' | 'contact' | 'status' | 'lastReply'
  | 'priority' | 'venueRentalFee' | 'fbMinimum'
  | 'availableDates' | 'nextAction' | 'notes'

function getSortValue(v: VenueRecord, col: SortCol): string {
  switch (col) {
    case 'name':          return v.name.toLowerCase()
    case 'region':        return (REGION_LABELS[v.region || ''] || v.region || '').toLowerCase()
    case 'contact':       return (v.contact.name || v.contact.email || '').toLowerCase()
    case 'status':        return (v.status || '').toLowerCase()
    case 'lastReply':     return v.lastResponseFrom || ''
    case 'priority':      return String(PRIORITY_ORDER[v.priority] ?? 3)
    case 'venueRentalFee':return (v.venueRentalFee || '').toLowerCase()
    case 'fbMinimum':     return (v.fbMinimum || '').toLowerCase()
    case 'availableDates':return (v.availableDates || '').toLowerCase()
    case 'nextAction':    return (v.nextActionDueDate || v.nextAction || '').toLowerCase()
    case 'notes':         return (v.notes || '').toLowerCase()
  }
}

function sortVenues(venues: VenueRecord[], col: SortCol, dir: 'asc' | 'desc'): VenueRecord[] {
  const sign = dir === 'asc' ? 1 : -1
  return [...venues].sort((a, b) => {
    const va = getSortValue(a, col)
    const vb = getSortValue(b, col)
    // Empty values always sort last regardless of direction
    if (!va && vb) return 1
    if (va && !vb) return -1
    return sign * va.localeCompare(vb, undefined, { numeric: true })
  })
}

function SortTh({
  col, label, current, dir, onSort,
}: {
  col: SortCol
  label: string
  current: SortCol | null
  dir: 'asc' | 'desc'
  onSort: (col: SortCol) => void
}) {
  const active = current === col
  return (
    <th className="px-4 py-3 text-left whitespace-nowrap">
      <button
        onClick={() => onSort(col)}
        className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-opacity hover:opacity-70"
        style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        {label}
        <span className="opacity-50" style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}>
          {active
            ? dir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />
            : <ChevronsUpDown size={11} />}
        </span>
      </button>
    </th>
  )
}

export default function MyVenuesPage() {
  const { data: session } = useSession()
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [search, setSearch] = useState('')
  const [lastReplyFilter, setLastReplyFilter] = useState<'all' | 'vendor' | 'user'>('all')
  const [sortCol, setSortCol] = useState<SortCol | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [loading, setLoading] = useState(false)
  const [userModified, setUserModified] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('mw_venues')
    if (stored) setVenues(JSON.parse(stored))
    if (session) {
      loadFromDb('mw_venues').then(data => {
        // Don't overwrite local edits made before the DB response came back
        if (data && !userModified) {
          setVenues(data as VenueRecord[])
          localStorage.setItem('mw_venues', JSON.stringify(data))
        }
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  function updateVenue(id: string, patch: Partial<VenueRecord>) {
    setUserModified(true)
    const updated = venues.map((v) => v.id === id ? { ...v, ...patch } : v)
    setVenues(updated)
    localStorage.setItem('mw_venues', JSON.stringify(updated))
    if (session) saveToDb('mw_venues', updated)
  }

  function handleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
  }

  const filtered = venues.filter((v) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      v.name.toLowerCase().includes(q) ||
      (v.contact.email || '').toLowerCase().includes(q) ||
      (v.contact.name || '').toLowerCase().includes(q) ||
      (v.notes || '').toLowerCase().includes(q) ||
      (v.status || '').toLowerCase().includes(q) ||
      (REGION_LABELS[v.region || ''] || v.region || '').toLowerCase().includes(q)

    // "vendor replied last" = explicitly marked vendor OR not manually marked at all
    // "monica replied last" = explicitly marked user
    const matchReply =
      lastReplyFilter === 'all' ||
      (lastReplyFilter === 'vendor' && v.lastResponseFrom !== 'user') ||
      (lastReplyFilter === 'user' && v.lastResponseFrom === 'user')

    return matchSearch && matchReply
  })

  const displayed = sortCol ? sortVenues(filtered, sortCol, sortDir) : filtered

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

  const monicaMarkedCount = venues.filter(v => v.lastResponseFrom === 'user').length

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
            {venues.length} venues tracked
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
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search venues, contacts, region, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          />
        </div>
        <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {([
            { val: 'all', label: 'All' },
            { val: 'vendor', label: 'Vendor replied last' },
            { val: 'user', label: 'Monica replied last' },
          ] as const).map(({ val, label }) => (
            <button
              key={val}
              onClick={() => setLastReplyFilter(val)}
              className="px-3 py-2 text-xs transition-colors whitespace-nowrap"
              style={{
                background: lastReplyFilter === val ? 'rgba(201,169,110,0.15)' : 'var(--card)',
                color: lastReplyFilter === val ? 'var(--accent)' : 'var(--text-muted)',
                borderRight: val !== 'user' ? '1px solid var(--border)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      {(search || lastReplyFilter !== 'all') && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Showing {displayed.length} of {venues.length} venues
        </p>
      )}

      {/* Empty state — no venues at all */}
      {venues.length === 0 && (
        <div className="rounded-xl p-10 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="font-medium">No venues loaded yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Go to the home page and import your Excel spreadsheet to see your venues here.
          </p>
        </div>
      )}

      {/* Empty state — Monica replied last filter with no marked venues */}
      {venues.length > 0 && displayed.length === 0 && lastReplyFilter === 'user' && (
        <div className="rounded-xl p-8 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="font-medium text-sm">No venues marked as &ldquo;Monica replied last&rdquo; yet</p>
          <p className="text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
            In the <strong>Last Reply</strong> column, click <strong>Monica</strong> on any venue where you sent the last message and are waiting to hear back.
          </p>
          {monicaMarkedCount === 0 && (
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              Tip: use &ldquo;All&rdquo; view to see all venues, then mark them.
            </p>
          )}
        </div>
      )}

      {/* Table */}
      {displayed.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: '#fdf2f4', borderBottom: '1px solid var(--border)' }}>
                  <SortTh col="name"          label="Venue / Vendor"  current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="region"        label="Region"          current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="contact"       label="Contact"         current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="status"        label="Status"          current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="lastReply"     label="Last Reply"      current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="priority"      label="Priority"        current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="venueRentalFee" label="Venue Fee"      current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="fbMinimum"     label="F&amp;B Min"     current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="availableDates" label="Available Dates" current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="nextAction"    label="Next Action"     current={sortCol} dir={sortDir} onSort={handleSort} />
                  <SortTh col="notes"         label="Notes"           current={sortCol} dir={sortDir} onSort={handleSort} />
                </tr>
              </thead>
              <tbody>
                {displayed.map((v, i) => (
                  <tr
                    key={v.id}
                    style={{
                      borderBottom: i < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                      background: i % 2 === 0 ? 'var(--card)' : 'var(--bg)',
                    }}
                  >
                    <td className="px-4 py-3 font-medium min-w-48 max-w-56">
                      <div className="truncate">{v.name}</div>
                      {v.contact.website && (
                        <div className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                          {v.contact.website}
                        </div>
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
                      {v.contact.phone && (
                        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.contact.phone}</div>
                      )}
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
                              ? {
                                  background: who === 'vendor' ? '#3d8a5620' : '#c054701a',
                                  color: who === 'vendor' ? '#3d8a56' : '#c05470',
                                  border: `1px solid ${who === 'vendor' ? '#3d8a56' : '#c05470'}`,
                                }
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
