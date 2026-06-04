'use client'

import { useSession, signIn } from 'next-auth/react'
import Link from 'next/link'
import { Mail, Search, FileText, Download, LogIn, Heart, CheckSquare, DollarSign, Users, FileCheck, Clock, Upload } from 'lucide-react'
import HelpBanner from '@/components/HelpBanner'
import { useEffect, useState } from 'react'
import type { VenueRecord, DraftEmail, ChecklistItem, BudgetItem, VendorRecord, ContractRecord } from '@/types'

function mergeVenues(existing: VenueRecord[], fresh: VenueRecord[]): VenueRecord[] {
  const map = new Map(existing.map((v) => [v.name.toLowerCase(), v]))
  for (const v of fresh) {
    if (!map.has(v.name.toLowerCase())) map.set(v.name.toLowerCase(), v)
  }
  return Array.from(map.values())
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [drafts, setDrafts] = useState<DraftEmail[]>([])
  const [checklist, setChecklist] = useState<ChecklistItem[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [contracts, setContracts] = useState<ContractRecord[]>([])

  useEffect(() => {
    const load = (key: string) => { const v = localStorage.getItem(key); return v ? JSON.parse(v) : [] }
    setVenues(load('mw_venues'))
    setDrafts(load('mw_drafts'))
    setChecklist(load('mw_checklist'))
    setBudget(load('mw_budget'))
    setVendors(load('mw_vendors'))
    setContracts(load('mw_contracts'))
  }, [])

  const pendingDrafts = drafts.filter((d) => d.status === 'pending').length
  const checklistDone = checklist.filter((c) => c.completed).length
  const checklistTotal = checklist.length
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0
  const totalBudget = budget.reduce((s, b) => s + (b.estimated || 0), 0)
  const totalPaid = budget.reduce((s, b) => s + (b.paid || 0), 0)
  const bookedVendors = vendors.filter((v) => v.status === 'booked').length
  const pendingContracts = contracts.filter((c) => !c.contractSigned).length

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-2 py-4">
        <div className="text-3xl">💍</div>
        <h1 className="text-2xl font-semibold" style={{ color: 'var(--accent)' }}>Monica&apos;s Wedding Planner</h1>
        <p style={{ color: 'var(--text-muted)' }}>Everything in one place — venues, vendors, budget, checklist, and more.</p>
      </div>

      {/* Help */}
      <HelpBanner
        storageKey="home"
        title="How to use Monica's Wedding Planner"
        intro="Follow these steps to get the most out of the app. You only need to set up once — everything saves automatically."
        steps={[
          { n: 1, text: 'Import your existing spreadsheet using the "Import Spreadsheet" button below — it will pull in all your venues, contacts, and notes.' },
          { n: 2, text: 'Sign in with Google to connect Monica\'s Gmail account. This unlocks inbox scanning and the ability to save email drafts.' },
          { n: 3, text: 'Go to Scan Inbox to analyze the last year of venue/vendor emails. AI extracts contacts, pricing, availability, and scores each one.' },
          { n: 4, text: 'Go to Find Venues to browse 19 pre-loaded luxury venues. Select any you haven\'t contacted and generate AI inquiry emails in one click.' },
          { n: 5, text: 'Check Drafts to review every AI-written email before it goes anywhere. Edit, then send to Gmail Drafts — Monica sends from her phone.' },
          { n: 6, text: 'Use Checklist, Budget, Vendors, Contracts, and Day-Of to track everything else as the wedding gets closer.' },
        ]}
        tips={[
          { text: 'Export to Excel any time to download a color-coded spreadsheet matching Monica\'s existing format.' },
          { text: 'All data is saved in the browser — no account needed beyond the Google sign-in for Gmail.' },
        ]}
      />

      {/* Auth prompt */}
      {!session && (
        <div className="rounded-xl p-6 flex flex-col items-center gap-4 text-center" style={{ background: 'var(--accent-light)', border: '1px solid var(--border)' }}>
          <p className="font-medium">Connect Gmail to scan venue emails & send drafts</p>
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <LogIn size={16} />
            Sign in with Google
          </button>
        </div>
      )}

      {/* Progress overview */}
      {checklistTotal > 0 && (
        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Overall Progress</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{checklistPct}% complete</span>
          </div>
          <div className="w-full rounded-full h-2.5" style={{ background: 'var(--accent-light)' }}>
            <div className="h-2.5 rounded-full transition-all" style={{ width: `${checklistPct}%`, background: 'var(--accent)' }} />
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-sm">
            {[
              { label: `${checklistDone}/${checklistTotal} tasks done`, color: 'var(--accent)' },
              { label: `${bookedVendors}/${vendors.length} vendors booked`, color: '#3d8a56' },
              { label: `${pendingContracts} contracts pending`, color: '#c9874a' },
              { label: `${pendingDrafts} email drafts waiting`, color: '#2e7fc7' },
            ].map(({ label, color }) => (
              <span key={label} className="px-2 py-0.5 rounded-full text-xs" style={{ background: `${color}18`, color }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Venues Tracked', value: venues.length, color: 'var(--accent)' },
          { label: 'Budget Estimated', value: `$${(totalBudget / 1000).toFixed(0)}k`, color: '#3d8a56' },
          { label: 'Paid So Far', value: `$${(totalPaid / 1000).toFixed(0)}k`, color: '#2e7fc7' },
          { label: 'Email Drafts', value: pendingDrafts, color: '#c9874a' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-2xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions — planning tools */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>PLANNING TOOLS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <QuickAction href="/checklist" icon={CheckSquare} title="Checklist" desc={`${checklistDone}/${checklistTotal} tasks complete`} />
          <QuickAction href="/budget" icon={DollarSign} title="Budget" desc={totalBudget > 0 ? `$${(totalBudget / 1000).toFixed(0)}k estimated total` : 'Track all wedding costs'} />
          <QuickAction href="/vendors" icon={Users} title="Vendors" desc={vendors.length > 0 ? `${bookedVendors}/${vendors.length} booked` : 'Photographer, florist & more'} />
          <QuickAction href="/contracts" icon={FileCheck} title="Contracts" desc={contracts.length > 0 ? `${contracts.length - pendingContracts}/${contracts.length} signed` : 'Track deposits & payments'} />
          <QuickAction href="/timeline" icon={Clock} title="Day-Of Timeline" desc="Plan every moment of the day" />
        </div>
      </div>

      {/* Quick actions — venue tools */}
      <div>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>VENUE & EMAIL TOOLS</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <ImportAction onImport={(imported) => {
            const merged = mergeVenues(venues, imported)
            setVenues(merged)
            localStorage.setItem('mw_venues', JSON.stringify(merged))
          }} />
          <QuickAction href="/scan" icon={Mail} title="Scan Inbox" desc="Analyze venue emails from Gmail" />
          <QuickAction href="/venues" icon={Search} title="Find Venues" desc="Browse luxury venue list" />
          <QuickAction href="/drafts" icon={FileText} title="Email Drafts" desc={`${pendingDrafts} pending approval`} />
          <ExportAction venues={venues} />
        </div>
      </div>
    </div>
  )
}

function QuickAction({ href, icon: Icon, title, desc }: { href: string; icon: typeof Mail; title: string; desc: string }) {
  return (
    <Link
      href={href}
      className="rounded-xl p-4 flex flex-col gap-2 transition-all hover:shadow-sm"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <Icon size={16} style={{ color: 'var(--accent)' }} />
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</div>
    </Link>
  )
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
      alert("Import failed — make sure it's the correct Excel file.")
    }
    setLoading(false)
    e.target.value = ''
  }

  return (
    <label className="rounded-xl p-4 flex flex-col gap-2 cursor-pointer transition-all hover:shadow-sm" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      <Upload size={16} style={{ color: 'var(--accent)' }} />
      <div className="font-medium text-sm">Import Spreadsheet</div>
      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{loading ? 'Importing…' : 'Upload existing Excel file'}</div>
      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} disabled={loading} />
    </label>
  )
}

function ExportAction({ venues }: { venues: VenueRecord[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleExport() {
    if (venues.length === 0) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venues }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Export failed (${res.status})`)
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'monica-wedding-venues.xlsx'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={venues.length === 0 || loading}
      className="rounded-xl p-4 flex flex-col gap-2 text-left transition-all hover:shadow-sm disabled:opacity-40"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <Download size={16} style={{ color: error ? '#f87171' : 'var(--accent)' }} />
      <div className="font-medium text-sm">Export to Excel</div>
      <div className="text-xs" style={{ color: error ? '#f87171' : 'var(--text-muted)' }}>
        {error || (loading ? 'Exporting…' : venues.length > 0 ? `Download ${venues.length} venues` : 'Import data first')}
      </div>
    </button>
  )
}
