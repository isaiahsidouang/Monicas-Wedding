'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Users, Waves, Send, Sparkles, ChevronDown } from 'lucide-react'
import { knownVenues } from '@/lib/monica'
import HelpBanner from '@/components/HelpBanner'
import type { KnownVenue, DraftEmail } from '@/types'

// ── Filter Options ─────────────────────────────────────────────────────────────

const FILTER_REGION = [
  { value: 'california',       label: 'California – Los Angeles' },
  { value: 'california-sd',    label: 'California – San Diego' },
  { value: 'california-napa',  label: 'California – Napa Valley' },
  { value: 'california-sb',    label: 'California – Santa Barbara' },
  { value: 'california-sf',    label: 'California – San Francisco' },
  { value: 'california-palm',  label: 'California – Palm Springs' },
  { value: 'chicago',          label: 'Chicago / Illinois' },
  { value: 'new-york',         label: 'New York City' },
  { value: 'new-england',      label: 'New England (Boston / Newport)' },
  { value: 'miami',            label: 'Miami / South Florida' },
  { value: 'florida-keys',     label: 'Florida Keys' },
  { value: 'new-orleans',      label: 'New Orleans, Louisiana' },
  { value: 'nashville',        label: 'Nashville, Tennessee' },
  { value: 'las-vegas',        label: 'Las Vegas, Nevada' },
  { value: 'scottsdale',       label: 'Scottsdale, Arizona' },
  { value: 'hawaii',           label: 'Hawaii – Maui' },
  { value: 'hawaii-oahu',      label: 'Hawaii – Oahu / Big Island' },
  { value: 'puerto-rico',      label: 'Puerto Rico' },
  { value: 'usvi',             label: 'US Virgin Islands' },
  { value: 'caribbean',        label: 'Caribbean – Grand Cayman' },
  { value: 'caribbean-aruba',  label: 'Caribbean – Aruba' },
  { value: 'caribbean-bda',    label: 'Caribbean – Bermuda' },
  { value: 'caribbean-tc',     label: 'Caribbean – Turks & Caicos' },
  { value: 'caribbean-bds',    label: 'Caribbean – Barbados' },
  { value: 'caribbean-sl',     label: 'Caribbean – St. Lucia' },
  { value: 'caribbean-ant',    label: 'Caribbean – Antigua' },
]

const FILTER_BRAND = [
  { value: 'Ritz-Carlton',      label: 'Ritz-Carlton' },
  { value: 'Four Seasons',      label: 'Four Seasons' },
  { value: 'St. Regis',         label: 'St. Regis' },
  { value: 'Rosewood',          label: 'Rosewood' },
  { value: 'Aman',              label: 'Aman' },
  { value: 'Waldorf Astoria',   label: 'Waldorf Astoria' },
  { value: 'EDITION',           label: 'EDITION Hotels' },
  { value: 'W Hotels',          label: 'W Hotels' },
  { value: 'Mandarin Oriental', label: 'Mandarin Oriental' },
  { value: 'Conrad',            label: 'Conrad Hotels' },
  { value: 'Park Hyatt',        label: 'Park Hyatt' },
  { value: 'Andaz',             label: 'Andaz by Hyatt' },
  { value: 'Auberge Resorts',   label: 'Auberge Resorts' },
  { value: '1 Hotels',          label: '1 Hotels' },
  { value: 'Montage',           label: 'Montage Hotels' },
  { value: 'Pendry',            label: 'Pendry Hotels' },
  { value: 'Grand Hyatt',       label: 'Grand Hyatt' },
  { value: 'InterContinental',  label: 'InterContinental' },
  { value: 'Belmond',           label: 'Belmond' },
  { value: 'Capella',           label: 'Capella Hotels' },
  { value: 'Raffles',           label: 'Raffles' },
  { value: 'Banyan Tree',       label: 'Banyan Tree' },
  { value: 'SLS',               label: 'SLS Hotels' },
  { value: 'JW Marriott',       label: 'JW Marriott' },
  { value: 'Loews',             label: 'Loews Hotels' },
]

const FILTER_SETTING = [
  { value: 'oceanfront', label: 'Oceanfront / Beachfront' },
  { value: 'city',       label: 'City Hotel & Ballroom' },
  { value: 'resort',     label: 'Resort & Estate' },
  { value: 'garden',     label: 'Garden & Outdoor' },
  { value: 'rooftop',    label: 'Rooftop Venue' },
  { value: 'historic',   label: 'Historic / Landmark' },
  { value: 'vineyard',   label: 'Vineyard / Winery' },
  { value: 'island',     label: 'Private Island Resort' },
  { value: 'mountain',   label: 'Mountain & Scenic' },
  { value: 'villa',      label: 'Private Villa' },
]

const FILTER_CAPACITY = [
  { value: '200',  label: '200+ guests' },
  { value: '250',  label: '250+ guests' },
  { value: '300',  label: '300+ guests' },
  { value: '350',  label: '350+ guests' },
  { value: '400',  label: '400+ guests' },
  { value: '450',  label: '450+ guests' },
  { value: '500',  label: '500+ guests' },
  { value: '600',  label: '600+ guests' },
  { value: '700',  label: '700+ guests' },
  { value: '800',  label: '800+ guests' },
  { value: '1000', label: '1,000+ guests' },
]

const REGION_TAB_LABELS: Record<string, string> = {
  all:            'All Locations',
  california:     'California',
  chicago:        'Chicago',
  miami:          'Miami / South FL',
  'puerto-rico':  'Puerto Rico',
  caribbean:      'Caribbean',
  hawaii:         'Hawaii',
  'new-york':     'New York',
  'florida-keys': 'Florida Keys',
  'new-england':  'New England',
  nashville:      'Nashville',
  'new-orleans':  'New Orleans',
  'las-vegas':    'Las Vegas',
  scottsdale:     'Scottsdale',
  usvi:           'USVI',
  other:          'Other',
}

const ALWAYS_TABS = new Set(['all', 'california', 'chicago', 'miami', 'puerto-rico', 'caribbean'])

// ── MultiSelect ────────────────────────────────────────────────────────────────

const triggerStyle: React.CSSProperties = {
  background:     'var(--card)',
  border:         '1px solid var(--border)',
  color:          'var(--text)',
  borderRadius:   '8px',
  padding:        '8px 10px',
  fontSize:       '0.85rem',
  width:          '100%',
  cursor:         'pointer',
  display:        'flex',
  alignItems:     'center',
  justifyContent: 'space-between',
  textAlign:      'left',
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (val: string[]) => void
  placeholder: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  function toggle(value: string) {
    onChange(selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value])
  }

  const displayLabel =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? (options.find(o => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selected`

  return (
    <div ref={ref} className="flex flex-col gap-1.5" style={{ position: 'relative' }}>
      <label className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <button type="button" onClick={() => setOpen(o => !o)} style={triggerStyle}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {displayLabel}
        </span>
        <ChevronDown
          size={12}
          style={{ flexShrink: 0, marginLeft: 6, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <div style={{
          position:  'absolute',
          top:       'calc(100% + 4px)',
          left:      0,
          right:     0,
          zIndex:    100,
          background:'#1e1a15',
          border:    '1px solid var(--border)',
          borderRadius: 8,
          maxHeight: 280,
          overflowY: 'auto',
          boxShadow: '0 12px 32px rgba(0,0,0,0.55)',
        }}>
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-2 text-xs"
              style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}
            >
              Clear selection
            </button>
          )}
          {options.map(opt => {
            const checked = selected.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left"
                style={{
                  color:      checked ? 'var(--accent)' : 'var(--text)',
                  background: checked ? 'rgba(201,169,110,0.08)' : 'transparent',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => {
                  if (!checked) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = checked ? 'rgba(201,169,110,0.08)' : 'transparent'
                }}
              >
                <div style={{
                  width:      14,
                  height:     14,
                  flexShrink: 0,
                  border:     `1.5px solid ${checked ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 3,
                  background: checked ? 'var(--accent)' : 'transparent',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {checked && <span style={{ color: '#0c0a08', fontSize: 8, fontWeight: 800, lineHeight: 1 }}>✓</span>}
                </div>
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function VenuesPage() {
  const [regionTab, setRegionTab] = useState<string>('all')
  const [selected,  setSelected]  = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [generated,  setGenerated]  = useState(0)

  const [searchRegions,    setSearchRegions]    = useState<string[]>([])
  const [searchBrands,     setSearchBrands]     = useState<string[]>([])
  const [searchSettings,   setSearchSettings]   = useState<string[]>([])
  const [searchCapacities, setSearchCapacities] = useState<string[]>([])

  const [discovering,      setDiscovering]      = useState(false)
  const [discoveredVenues, setDiscoveredVenues] = useState<KnownVenue[]>([])
  const [discoverError,    setDiscoverError]    = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('mw_discovered_venues')
    if (stored) setDiscoveredVenues(JSON.parse(stored))
  }, [])

  const allVenues = [...knownVenues, ...discoveredVenues]
  const filtered  = allVenues.filter(v => regionTab === 'all' || v.region === regionTab)

  const tabsToShow = Object.entries(REGION_TAB_LABELS).filter(([key]) => {
    if (ALWAYS_TABS.has(key)) return true
    return allVenues.filter(v => v.region === key).length > 0
  })

  async function runSearch() {
    setDiscovering(true)
    setDiscoverError('')
    const params = new URLSearchParams({
      region:   searchRegions.join(','),
      brand:    searchBrands.join(','),
      setting:  searchSettings.join(','),
      capacity: searchCapacities.join(','),
    })
    try {
      const res = await fetch(`/api/venues/search?${params}`)
      if (!res.ok) throw new Error('Search failed')
      const { venues } = await res.json()
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
          { n: 1, text: 'Use the AI search panel — pick any combination of regions, brands, settings, and capacities (multi-select supported), then click Search.' },
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

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <MultiSelect
            label="Region"
            options={FILTER_REGION}
            selected={searchRegions}
            onChange={setSearchRegions}
            placeholder="All Regions"
          />
          <MultiSelect
            label="Brand"
            options={FILTER_BRAND}
            selected={searchBrands}
            onChange={setSearchBrands}
            placeholder="Any Brand"
          />
          <MultiSelect
            label="Setting"
            options={FILTER_SETTING}
            selected={searchSettings}
            onChange={setSearchSettings}
            placeholder="Any Setting"
          />
          <MultiSelect
            label="Min Capacity"
            options={FILTER_CAPACITY}
            selected={searchCapacities}
            onChange={setSearchCapacities}
            placeholder="Any Capacity"
          />
        </div>

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
        {tabsToShow.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setRegionTab(key)}
            className="px-3 py-1.5 rounded-lg text-sm transition-colors"
            style={{
              background: regionTab === key ? 'rgba(201,169,110,0.15)' : 'var(--card)',
              border:     `1px solid ${regionTab === key ? 'var(--accent)' : 'var(--border)'}`,
              color:      regionTab === key ? 'var(--accent)' : 'var(--text-muted)',
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
