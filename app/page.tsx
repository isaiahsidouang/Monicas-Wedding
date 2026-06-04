'use client'

import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { Mail, Search, FileText, Download, LogIn, Heart, Upload } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { VenueRecord, DraftEmail } from '@/types'
import { weddingProfile } from '@/lib/monica'

export default function Dashboard() {
  const { data: session } = useSession()
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [drafts, setDrafts] = useState<DraftEmail[]>([])

  useEffect(() => {
    const v = localStorage.getItem('mw_venues')
    const d = localStorage.getItem('mw_drafts')
    if (v) setVenues(JSON.parse(v))
    if (d) setDrafts(JSON.parse(d))
  }, [])

  const highPriority = venues.filter((v) => v.priorityScore >= 7)
  const pendingDrafts = drafts.filter((d) => d.status === 'pending')

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Heart size={18} style={{ color: 'var(--accent)' }} />
          <h1 className="text-2xl font-semibold">Monica&apos;s Wedding Planner</h1>
        </div>
      </div>

      {/* Auth prompt */}
      {!session && (
        <div
          className="rounded-xl p-6 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="font-medium">Connect Monica&apos;s Gmail to get started</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            We&apos;ll scan for venue emails, generate drafts, and export everything to Excel — all in one place.
          </p>
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-opacity hover:opacity-85"
            style={{ background: 'var(--accent)', color: '#0c0a08' }}
          >
            <LogIn size={16} />
            Sign in with Google
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Venues Scanned', value: venues.length, color: 'var(--accent)' },
          { label: 'High Priority', value: highPriority.length, color: '#4ade80' },
          { label: 'Drafts Pending', value: pendingDrafts.length, color: '#818cf8' },
          { label: 'Contacted', value: venues.filter((v) => v.status !== 'new').length, color: '#38bdf8' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ImportAction onImport={(imported) => {
          const merged = mergeVenues(venues, imported)
          setVenues(merged)
          localStorage.setItem('mw_venues', JSON.stringify(merged))
        }} />
        <QuickAction
          href="/scan"
          icon={Mail}
          title="Scan Inbox"
          desc="Analyze venue & vendor emails from Monica's Gmail"
          cta="Scan now"
        />
        <QuickAction
          href="/venues"
          icon={Search}
          title="Find Venues"
          desc="Browse curated luxury venues and generate inquiry emails"
          cta="Explore venues"
        />
        <QuickAction
          href="/drafts"
          icon={FileText}
          title="Review Drafts"
          desc={`${pendingDrafts.length} email${pendingDrafts.length !== 1 ? 's' : ''} waiting for approval`}
          cta="Review"
        />
        <ExportAction venues={venues} />
      </div>

      {/* Top venues */}
      {highPriority.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-medium">Top Picks</h2>
          <div className="flex flex-col gap-2">
            {highPriority.slice(0, 3).map((v) => (
              <div
                key={v.id}
                className="rounded-lg px-4 py-3 flex items-center justify-between"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div>
                  <div className="font-medium text-sm">{v.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{v.location}</div>
                </div>
                <div className="text-lg font-bold" style={{ color: '#4ade80' }}>
                  {v.priorityScore}<span className="text-xs font-normal" style={{ color: 'var(--text-muted)' }}>/10</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function mergeVenues(existing: VenueRecord[], fresh: VenueRecord[]): VenueRecord[] {
  const map = new Map(existing.map((v) => [v.name.toLowerCase(), v]))
  for (const v of fresh) {
    if (!map.has(v.name.toLowerCase())) map.set(v.name.toLowerCase(), v)
  }
  return Array.from(map.values())
}

function ImportAction({ onImport }: { onImport: (venues: VenueRecord[]) => void }) {
  const [loading, setLoading] = useState(false)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    if (res.ok) {
      const { venues, count } = await res.json()
      onImport(venues)
      alert(`Imported ${count} venues from your spreadsheet!`)
    } else {
      alert('Import failed — make sure it\'s the correct Excel file.')
    }
    setLoading(false)
    e.target.value = ''
  }

  return (
    <label
      className="rounded-xl p-5 flex flex-col gap-2 cursor-pointer transition-colors"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <Upload size={18} style={{ color: 'var(--accent)' }} />
      <div className="font-medium">Import Existing Spreadsheet</div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Upload Monica&apos;s existing Excel file to preserve all her progress
      </div>
      <span className="text-sm mt-auto" style={{ color: 'var(--accent)' }}>
        {loading ? 'Importing…' : 'Upload .xlsx →'}
      </span>
      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={loading} />
    </label>
  )
}

function QuickAction({
  href, icon: Icon, title, desc, cta,
}: {
  href: string; icon: typeof Mail; title: string; desc: string; cta: string
}) {
  return (
    <Link
      href={href}
      className="rounded-xl p-5 flex flex-col gap-2 group transition-colors"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <Icon size={18} style={{ color: 'var(--accent)' }} />
      <div className="font-medium">{title}</div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{desc}</div>
      <span className="text-sm mt-auto" style={{ color: 'var(--accent)' }}>
        {cta} →
      </span>
    </Link>
  )
}

function ExportAction({ venues }: { venues: VenueRecord[] }) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    if (venues.length === 0) return
    setLoading(true)
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venues }),
    })
    if (res.ok) {
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'monica-wedding-venues.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    }
    setLoading(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={venues.length === 0 || loading}
      className="rounded-xl p-5 flex flex-col gap-2 text-left transition-colors disabled:opacity-40"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <Download size={18} style={{ color: 'var(--accent)' }} />
      <div className="font-medium">Export to Excel</div>
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        {venues.length > 0 ? `Download ${venues.length} venues as .xlsx` : 'Scan inbox first to get data'}
      </div>
      <span className="text-sm mt-auto" style={{ color: 'var(--accent)' }}>
        {loading ? 'Exporting…' : 'Download →'}
      </span>
    </button>
  )
}
