'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Mail, RefreshCw, LogIn, SortAsc } from 'lucide-react'
import VenueCard from '@/components/VenueCard'
import type { VenueRecord, DraftEmail } from '@/types'

type SortKey = 'priorityScore' | 'name' | 'status' | 'emailDate'

export default function ScanPage() {
  const { data: session } = useSession()
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [scannedCount, setScannedCount] = useState(0)
  const [sort, setSort] = useState<SortKey>('priorityScore')
  const [filter, setFilter] = useState<'all' | 'venue' | 'vendor'>('all')

  useEffect(() => {
    const stored = localStorage.getItem('mw_venues')
    if (stored) setVenues(JSON.parse(stored))
  }, [])

  function persist(updated: VenueRecord[]) {
    setVenues(updated)
    localStorage.setItem('mw_venues', JSON.stringify(updated))
  }

  async function handleScan() {
    setScanning(true)
    setError('')
    try {
      const res = await fetch('/api/gmail/scan')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Scan failed')
      }
      const { venues: newVenues, scanned } = await res.json()
      setScannedCount(scanned)
      const merged = mergeVenues(venues, newVenues)
      persist(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setScanning(false)
    }
  }

  function mergeVenues(existing: VenueRecord[], fresh: VenueRecord[]): VenueRecord[] {
    const map = new Map(existing.map((v) => [v.id, v]))
    for (const v of fresh) map.set(v.id, v)
    return Array.from(map.values())
  }

  function handleStatusChange(id: string, status: VenueRecord['status']) {
    persist(venues.map((v) => (v.id === id ? { ...v, status } : v)))
  }

  async function handleDraftEmail(venue: VenueRecord, type: 'follow-up' | 'decline') {
    const res = await fetch('/api/draft-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type === 'decline' ? 'follow-up' : 'follow-up',
        venue: {
          name: venue.name,
          contactEmail: venue.contact.email,
          originalSubject: venue.emailSubject || venue.name,
          interested: type === 'follow-up',
        },
      }),
    })
    if (!res.ok) return
    const { subject, body } = await res.json()
    const draft: DraftEmail = {
      id: crypto.randomUUID(),
      venueId: venue.id,
      venueName: venue.name,
      to: venue.contact.email,
      subject,
      body,
      type: type === 'decline' ? 'decline' : 'follow-up',
      status: 'pending',
      createdAt: new Date().toISOString(),
    }
    const existing = JSON.parse(localStorage.getItem('mw_drafts') || '[]')
    localStorage.setItem('mw_drafts', JSON.stringify([...existing, draft]))
    alert(`Draft created! Go to the Drafts tab to review and send to Gmail.`)
  }

  const sorted = [...venues]
    .filter((v) => filter === 'all' || v.type === filter)
    .sort((a, b) => {
      if (sort === 'priorityScore') return b.priorityScore - a.priorityScore
      if (sort === 'name') return a.name.localeCompare(b.name)
      if (sort === 'status') return a.status.localeCompare(b.status)
      if (sort === 'emailDate') return (b.emailDate || '').localeCompare(a.emailDate || '')
      return 0
    })

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center gap-4 text-center">
        <Mail size={40} style={{ color: 'var(--accent)' }} />
        <h1 className="text-xl font-semibold">Sign in to scan Gmail</h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Connect Monica&apos;s Google account to read venue & vendor emails.
        </p>
        <button
          onClick={() => signIn('google')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium mt-2"
          style={{ background: 'var(--accent)', color: '#0c0a08' }}
        >
          <LogIn size={16} />
          Sign in with Google
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Mail size={18} style={{ color: 'var(--accent)' }} />
          Inbox Scanner
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Scans Monica&apos;s Gmail for venue & vendor emails, then uses AI to extract and prioritize them.
        </p>
      </div>

      {/* Scan button */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium w-fit transition-opacity hover:opacity-85 disabled:opacity-50"
          style={{ background: 'var(--accent)', color: '#0c0a08' }}
        >
          <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
          {scanning ? 'Scanning & Analyzing…' : 'Scan Inbox'}
        </button>

        {scannedCount > 0 && !scanning && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Scanned {scannedCount} emails · found {venues.length} venue/vendor records
          </p>
        )}

        {error && (
          <p className="text-sm" style={{ color: '#f87171' }}>
            Error: {error}
          </p>
        )}
      </div>

      {/* Filters & sort */}
      {venues.length > 0 && (
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {(['all', 'venue', 'vendor'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="px-3 py-1 rounded-md text-sm capitalize transition-colors"
                style={{
                  background: filter === f ? 'rgba(201,169,110,0.15)' : 'transparent',
                  color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <SortAsc size={14} style={{ color: 'var(--text-muted)' }} />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="text-sm rounded-lg px-2 py-1 outline-none"
              style={{ background: 'var(--card)', border: '1px solid var(--border)', color: '#f0ebe4' }}
            >
              <option value="priorityScore">Priority Score</option>
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="emailDate">Email Date</option>
            </select>
          </div>
        </div>
      )}

      {/* Results */}
      {sorted.length === 0 && !scanning && (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          {venues.length === 0 ? 'Click "Scan Inbox" to get started.' : 'No results for this filter.'}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sorted.map((v) => (
          <VenueCard
            key={v.id}
            venue={v}
            onStatusChange={handleStatusChange}
            onDraftEmail={handleDraftEmail}
          />
        ))}
      </div>
    </div>
  )
}
