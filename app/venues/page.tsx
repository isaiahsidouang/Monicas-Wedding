'use client'

import { useState } from 'react'
import { Search, MapPin, Users, Waves, Send } from 'lucide-react'
import { knownVenues, weddingProfile } from '@/lib/monica'
import HelpBanner from '@/components/HelpBanner'
import type { KnownVenue, DraftEmail } from '@/types'

const REGION_LABELS: Record<string, string> = {
  all: 'All Locations',
  california: 'California',
  chicago: 'Chicago',
  miami: 'Miami / South FL',
  'puerto-rico': 'Puerto Rico',
  caribbean: 'Caribbean',
}

export default function VenuesPage() {
  const [region, setRegion] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(0)

  const filtered = knownVenues.filter((v) => region === 'all' || v.region === region)

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function generateInquiries() {
    setGenerating(true)
    setGenerated(0)

    const toGenerate = knownVenues.filter((v) => selected.has(v.id))
    const newDrafts: DraftEmail[] = []

    for (const venue of toGenerate) {
      const isCaribbean = venue.region === 'caribbean' || venue.region === 'puerto-rico'
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry',
          venue: {
            name: venue.name,
            location: venue.location,
            contactEmail: venue.contactEmail || '',
            description: venue.description,
            isCaribbean,
          },
        }),
      })
      if (res.ok) {
        const { subject, body } = await res.json()
        newDrafts.push({
          id: crypto.randomUUID(),
          venueName: venue.name,
          to: venue.contactEmail || '',
          subject,
          body,
          type: 'inquiry',
          status: 'pending',
          createdAt: new Date().toISOString(),
        })
      }
      setGenerated((n) => n + 1)
    }

    const existing = JSON.parse(localStorage.getItem('mw_drafts') || '[]')
    localStorage.setItem('mw_drafts', JSON.stringify([...existing, ...newDrafts]))
    setGenerating(false)
    setSelected(new Set())
    alert(`${newDrafts.length} inquiry draft${newDrafts.length !== 1 ? 's' : ''} created! Go to the Drafts tab to review and send.`)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Search size={18} style={{ color: 'var(--accent)' }} />
          Find Venues
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Curated {weddingProfile.preferredBrands.join(', ')} properties that fit Monica&apos;s requirements.
          Select venues to generate AI-drafted inquiry emails.
        </p>
      </div>

      {/* Help */}
      <HelpBanner
        storageKey="venues"
        title="How to use Find Venues"
        steps={[
          { n: 1, text: 'Browse the 19 pre-loaded luxury venues (Ritz-Carlton, St. Regis, Four Seasons, Rosewood) filtered by region.' },
          { n: 2, text: 'Check the box on any venue you haven\'t contacted yet, or want to reach out to again.' },
          { n: 3, text: 'Click "Generate Inquiry Emails" — AI drafts a personalized inquiry for each selected venue using Monica\'s wedding details.' },
          { n: 4, text: 'Go to the Drafts tab to review every email before it\'s sent to Gmail.' },
        ]}
        tips={[
          { text: 'All 19 venues are automatically included in every Excel export, even before you scan your inbox.' },
          { text: 'Oceanfront venues are marked with a blue badge — important for Caribbean and PR locations.' },
        ]}
      />

      {/* Region filter */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(REGION_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRegion(key)}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: region === key ? 'rgba(201,169,110,0.15)' : 'var(--card)',
              border: `1px solid ${region === key ? 'var(--accent)' : 'var(--border)'}`,
              color: region === key ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {label} ({key === 'all' ? knownVenues.length : knownVenues.filter((v) => v.region === key).length})
          </button>
        ))}
      </div>

      {/* Selection toolbar */}
      {selected.size > 0 && (
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: 'rgba(201,169,110,0.1)', border: '1px solid rgba(201,169,110,0.3)' }}
        >
          <span className="text-sm" style={{ color: 'var(--accent)' }}>
            {selected.size} venue{selected.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelected(new Set())}
              className="text-sm px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Clear
            </button>
            <button
              onClick={generateInquiries}
              disabled={generating}
              className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium disabled:opacity-50"
              style={{ background: 'var(--accent)', color: '#0c0a08' }}
            >
              <Send size={13} />
              {generating ? `Drafting ${generated}/${selected.size}…` : 'Generate Inquiry Emails'}
            </button>
          </div>
        </div>
      )}

      {/* Venue grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((venue) => (
          <VenueCard
            key={venue.id}
            venue={venue}
            selected={selected.has(venue.id)}
            onToggle={toggle}
          />
        ))}
      </div>
    </div>
  )
}

function VenueCard({ venue, selected, onToggle }: {
  venue: KnownVenue
  selected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <button
      onClick={() => onToggle(venue.id)}
      className="rounded-xl p-4 flex flex-col gap-3 text-left transition-all"
      style={{
        background: selected ? 'rgba(201,169,110,0.08)' : 'var(--card)',
        border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm leading-snug">{venue.name}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{venue.brand}</div>
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
          style={{
            borderColor: selected ? 'var(--accent)' : 'var(--border)',
            background: selected ? 'var(--accent)' : 'transparent',
          }}
        >
          {selected && <span className="text-xs" style={{ color: '#0c0a08' }}>✓</span>}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1">
          <MapPin size={11} />
          {venue.location}
        </span>
        <span className="flex items-center gap-1">
          <Users size={11} />
          {venue.capacity}
        </span>
        {venue.isOceanfront && (
          <span className="flex items-center gap-1" style={{ color: '#38bdf8' }}>
            <Waves size={11} />
            Oceanfront
          </span>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {venue.description}
      </p>

      {venue.contactEmail && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          📧 {venue.contactEmail}
        </div>
      )}
    </button>
  )
}
