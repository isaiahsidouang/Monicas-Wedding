'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { Mail, RefreshCw, LogIn, SortAsc, FlaskConical } from 'lucide-react'
import HelpBanner from '@/components/HelpBanner'
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

  async function runScan(url: string) {
    setScanning(true)
    setError('')
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Scan failed')
      }
      const { venues: newVenues, scanned, testMode } = await res.json()
      setScannedCount(scanned)
      const merged = mergeVenues(venues, newVenues)
      persist(merged)
      if (testMode) setError('') // clear any prior error; test succeeded
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setScanning(false)
    }
  }

  function handleScan()     { runScan('/api/gmail/scan') }
  function handleTestScan() { runScan('/api/gmail/scan-test') }

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
        type: type === 'decline' ? 'decline' : 'follow-up',
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

      {/* Session expired warning */}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {session && (session as any).error === 'RefreshTokenError' && (
        <div className="rounded-xl px-4 py-3 flex items-center gap-3" style={{ background: '#fff0f0', border: '1px solid #f5b0b0' }}>
          <span className="text-sm" style={{ color: '#c05470' }}>
            Your Google session expired — scans will fail.
          </span>
          <button onClick={() => signIn('google')} className="text-sm font-medium underline ml-auto" style={{ color: '#c05470' }}>
            Sign in again
          </button>
        </div>
      )}

      {/* Help */}
      <HelpBanner
        storageKey="scan"
        title="How to use Inbox Scanner"
        steps={[
          { n: 1, text: 'Sign in with Google to connect Monica\'s Gmail (meniasmonica@gmail.com or oseiandmonica@gmail.com).' },
          { n: 2, text: 'Click "Scan Inbox" — the AI reads the last 365 days of emails and pulls out every venue and vendor contact automatically.' },
          { n: 3, text: 'Review the cards. Priority score 8–10 = great fit for Monica\'s requirements. Click the status badge to update (contacted → interested → toured → booked).' },
          { n: 4, text: 'Click "Draft Follow-up" on any card to have AI write a follow-up email. It goes to Drafts for review before sending.' },
          { n: 5, text: 'You can scan as many times as you want — new emails merge in, existing records are not duplicated.' },
        ]}
        tips={[
          { text: 'Use "Test Mode" to try the full pipeline without Gmail — it runs 6 sample venue emails through the AI so you can see how it works.' },
          { text: 'Expand any card ("More details") to see the contact, pros/cons, and a direct link back to the original Gmail thread.' },
        ]}
      />

      {/* Scan button */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {session ? (
            <button
              onClick={handleScan}
              disabled={scanning}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#0c0a08' }}
            >
              <RefreshCw size={15} className={scanning ? 'animate-spin' : ''} />
              {scanning ? 'Scanning & Analyzing…' : 'Scan Inbox'}
            </button>
          ) : (
            <button
              onClick={() => signIn('google')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
              style={{ background: 'var(--accent)', color: '#0c0a08' }}
            >
              <LogIn size={16} />
              Sign in with Google to Scan
            </button>
          )}
          <button
            onClick={handleTestScan}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            title="Run analysis on 6 sample venue emails — no Gmail required"
          >
            <FlaskConical size={15} />
            Test Mode
          </button>
        </div>

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
          {venues.length === 0 ? 'Sign in and click "Scan Inbox", or try "Test Mode" to run a sample scan without Gmail.' : 'No results for this filter.'}
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
