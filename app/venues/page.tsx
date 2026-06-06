'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Users, Waves, Send, Sparkles } from 'lucide-react'
import { knownVenues, weddingProfile } from '@/lib/monica'
import HelpBanner from '@/components/HelpBanner'
import type { KnownVenue, DraftEmail } from '@/types'

const FILTER_REGION = [
  { value: 'all',          label: 'All Regions' },
  { value: 'california',   label: 'California' },
  { value: 'chicago',      label: 'Chicago' },
  { value: 'miami',        label: 'Miami / South FL' },
  { value: 'puerto-rico',  label: 'Puerto Rico' },
  { value: 'caribbean',    label: 'Caribbean' },
]

const FILTER_BRAND = [
  { value: 'any',                label: 'Any Luxury Brand' },
  { value: 'Ritz-Carlton',       label: 'Ritz-Carlton' },
  { value: 'Four Seasons',       label: 'Four Seasons' },
  { value: 'St. Regis',          label: 'St. Regis' },
  { value: 'Rosewood',           label: 'Rosewood' },
  { value: 'Aman',               label: 'Aman' },
  { value: 'Waldorf Astoria',    label: 'Waldorf Astoria' },
  { value: 'EDITION',            label: 'EDITION Hotels' },
  { value: 'W Hotels',           label: 'W Hotels' },
  { value: 'Mandarin Oriental',  label: 'Mandarin Oriental' },
  { value: 'Conrad',             label: 'Conrad Hotels' },
]

const FILTER_SETTING = [
  { value: 'any',        label: 'Any Setting' },
  { value: 'oceanfront', label: 'Oceanfront Only' },
  { value: 'city',       label: 'City / Ballroom' },
  { value: 'resort',     label: 'Resort & Estate' },
]

const FILTER_CAPACITY = [
  { value: '350', label: '350+ guests' },
  { value: '400', label: '400+ guests' },
  { value: '500', label: '500+ guests' },
]

const REGION_TAB_LABELS: Record<string, string> = {
  all:           'All Locations',
  california:    'California',
  chicago:       'Chicago',
  miami:         'Miami / South FL',
  'puerto-rico': 'Puerto Rico',
  caribbean:     'Caribbean',
}

const selectStyle: React.CSSProperties = {
  background:   'var(--card)',
  border:       '1px solid var(--border)',
  color:        'var(--text)',
  borderRadius: '8px',
  padding:      '8px 10px',
  fontSize:     '0.85rem',
  width:        '100%',
  outline:      'none',
  cursor:       'pointer',
}

export default function VenuesPage() {
  // Display filter (tabs)
  const [regionTab, setRegionTab] = useState<string>('all')

  // Selection & email generation
  const [selected,   setSelected]   = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generated,  setGenerated]  = useState(0)

  // AI search filters
  const [searchRegion,   setSearchRegion]   = useState('all')
  const [searchBrand,    setSearchBrand]    = useState('any')
  const [searchSetting,  setSearchSetting]  = useState('any')
  const [searchCapacity, setSearchCapacity] = useState('350')

  // AI search state
  const [discovering,      setDiscovering]      = useState(false)
  const [discoveredVenues, setDiscoveredVenues] = useState<KnownVenue[]>([])
  const [discoverError,    setDiscoverError]    = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mw_discovered_venues')
    if (stored) setDiscoveredVenues(JSON.parse(stored))
  }, [])

  const allVenues = [...knownVenues, ...discoveredVenues]
  const filtered  = allVenues.filter(v => regionTab === 'all' || v.region === regionTab)

  async function runSearch() {
    setDiscovering(true)
    setDiscoverError('')
    const params = new URLSearchParams({
      region:   searchRegion,
      brand:    searchBrand,
      setting:  searchSetting,
      capacity: searchCapacity,
    })
    try {
      const res = await fetch(`/api/venues/search?${params}`)
      if (!res.ok) throw new Error('Search failed')
      const { venues } = await res.json()
      // Merge new results with any existing ones (deduplicate by name)
      const merged = [
        ...discoveredVenues.filter(
          d => !venues.some((v: KnownVenue) => v.name.toLowerCase() === d.name.toLowerCase())
        ),
        ...venues,
      ]
      setDiscoveredVenues(merged)
      localStorage.setItem('mw_discovered_venues', JSON.stringify(merged))
    } catch (e) {
      setDiscoverError(e instanceof Error ? e.message : 'Search failed')
    } finally {
      setDiscovering(false)
    }
  }

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function generateInquiries() {
    setGenerating(true)
    setGenerated(0)
    const toGenerate = allVenues.filter(v => selected.has(v.id))
    const newDrafts: DraftEmail[] = []
    for (const venue of toGenerate) {
      const isCaribbean = venue.region === 'caribbean' || venue.region === 'puerto-rico'
      const res = await fetch('/api/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'inquiry',
          venue: { name: venue.name, location: venue.location, contactEmail: venue.contactEmail || '', description: venue.description, isCaribbean },
        }),
      })
      if (res.ok) {
        const { subject, body } = await res.json()
        newDrafts.push({ id: crypto.randomUUID(), venueName: venue.name, to: venue.contactEmail || '', subject, body, type: 'inquiry', status: 'pending', createdAt: new Date().toISOString() })
      }
      setGenerated(n => n + 1)
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
          Browse pre-loaded luxury properties or use AI to discover new ones based on Monica&apos;s requirements.
        </p>
      </div>

      {/* Help */}
      <HelpBanner
        storageKey="venues"
        title="How to use Find Venues"
        steps={[
          { n: 1, text: 'Use the AI search panel to filter by region, brand, setting, and capacity — then click Search to discover new venues.' },
          { n: 2, text: 'Check the box on any venue you want to contact.' },
          { n: 3, text: 'Click "Generate Inquiry Emails" — AI drafts a personalized inquiry for each selected venue.' },
          { n: 4, text: 'Go to the Drafts tab to review every email before sending to Gmail.' },
        ]}
        tips={[
          { text: 'Run multiple searches with different filters — results accumulate and are saved between visits.' },
          { text: 'AI-discovered venues are marked with a purple badge. Oceanfront venues have a blue badge.' },
        ]}
      />

      {/* ── AI Search Panel ─────────────────────────────── */}
      <div className="rounded-xl p-5 flex flex-col gap-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={15} style={{ color: 'var(--accent)' }} />
          <span className="font-medium text-sm">AI Venue Search</span>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
            {discoveredVenues.length > 0 ? `${discoveredVenues.length} venues found so far` : 'Finds venues not already in your list'}
          </span>
        </div>

        {/* Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Region</label>
            <select value={searchRegion} onChange={e => setSearchRegion(e.target.value)} style={selectStyle}>
              {FILTER_REGION.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Brand</label>
            <select value={searchBrand} onChange={e => setSearchBrand(e.target.value)} style={selectStyle}>
              {FILTER_BRAND.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Setting</label>
            <select value={searchSetting} onChange={e => setSearchSetting(e.target.value)} style={selectStyle}>
              {FILTER_SETTING.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Min Capacity</label>
            <select value={searchCapacity} onChange={e => setSearchCapacity(e.target.value)} style={selectStyle}>
              {FILTER_CAPACITY.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Search button + error */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={runSearch}
            disabled={discovering}
            className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0c0a08' }}
          >
            <Sparkles size={14} className={discovering ? 'animate-pulse' : ''} />
            {discovering ? 'Searching…' : 'Search'}
          </button>
          {discoveredVenues.length > 0 && !discovering && (
            <button
              onClick={() => { setDiscoveredVenues([]); localStorage.removeItem('mw_discovered_venues') }}
              className="text-xs px-3 py-2 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Clear results
            </button>
          )}
          {discoverError && <p className="text-sm" style={{ color: '#f87171' }}>Error: {discoverError}</p>}
        </div>
      </div>

      {/* ── Region tabs ─────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(REGION_TAB_LABELS).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRegionTab(key)}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background:  regionTab === key ? 'rgba(201,169,110,0.15)' : 'var(--card)',
              border:      `1px solid ${regionTab === key ? 'var(--accent)' : 'var(--border)'}`,
              color:       regionTab === key ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            {label} ({key === 'all' ? allVenues.length : allVenues.filter(v => v.region === key).length})
          </button>
        ))}
      </div>

      {/* ── Selection toolbar ────────────────────────────── */}
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

      {/* ── Venue grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map(venue => (
          <VenueCard key={venue.id} venue={venue} selected={selected.has(venue.id)} onToggle={toggle} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No venues in this region yet. Try running an AI search above.
        </div>
      )}

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
        border: `1px solid ${selected ? 'var(--accent)' : venue.discovered ? 'rgba(139,92,246,0.4)' : 'var(--border)'}`,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-semibold text-sm leading-snug">{venue.name}</div>
            {venue.discovered && (
              <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', fontSize: '0.58rem', letterSpacing: '0.06em', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                AI FOUND
              </span>
            )}
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--accent)' }}>{venue.brand}</div>
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
          style={{ borderColor: selected ? 'var(--accent)' : 'var(--border)', background: selected ? 'var(--accent)' : 'transparent' }}
        >
          {selected && <span className="text-xs" style={{ color: '#0c0a08' }}>✓</span>}
        </div>
      </div>

      {/* Info badges */}
      <div className="flex flex-wrap gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
        <span className="flex items-center gap-1"><MapPin size={11} />{venue.location}</span>
        <span className="flex items-center gap-1"><Users size={11} />{venue.capacity}</span>
        {venue.isOceanfront && (
          <span className="flex items-center gap-1" style={{ color: '#38bdf8' }}><Waves size={11} />Oceanfront</span>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{venue.description}</p>

      {venue.contactEmail && (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>📧 {venue.contactEmail}</div>
      )}
    </button>
  )
}
