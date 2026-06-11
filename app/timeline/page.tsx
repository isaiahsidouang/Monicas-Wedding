'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadFromDb, saveToDb } from '@/lib/db-client'
import { Clock, Plus, Trash2, Edit2, Check, X, GripVertical } from 'lucide-react'
import HelpBanner from '@/components/HelpBanner'
import type { TimelineItem } from '@/types'

const DEFAULT_TIMELINE: Omit<TimelineItem, 'id'>[] = [
  { time: '07:00', label: 'Hair & Makeup begins — Bride', category: 'prep', location: 'Bridal suite' },
  { time: '09:00', label: 'Hair & Makeup — Bridesmaids', category: 'prep', location: 'Bridal suite' },
  { time: '11:30', label: 'Bride gets into dress', category: 'prep', location: 'Bridal suite' },
  { time: '12:00', label: 'Bridal portraits', category: 'photos', responsible: 'Photographer' },
  { time: '12:30', label: 'First Look (optional)', category: 'photos', location: 'TBD' },
  { time: '13:00', label: 'Couple portraits', category: 'photos', responsible: 'Photographer' },
  { time: '14:00', label: 'Wedding party photos', category: 'photos', responsible: 'Photographer' },
  { time: '15:00', label: 'Family formal photos', category: 'photos', responsible: 'Photographer' },
  { time: '15:30', label: 'Guests begin arriving', category: 'ceremony' },
  { time: '16:00', label: 'Ceremony begins', category: 'ceremony' },
  { time: '16:30', label: 'Ceremony ends', category: 'ceremony' },
  { time: '16:30', label: 'Cocktail hour begins', category: 'reception', notes: 'Guests move to cocktail area' },
  { time: '18:00', label: 'Reception room opens', category: 'reception' },
  { time: '18:15', label: 'Grand entrance', category: 'reception' },
  { time: '18:30', label: 'First dance', category: 'reception' },
  { time: '18:45', label: 'Parent dances', category: 'reception' },
  { time: '19:00', label: 'Dinner service begins', category: 'reception' },
  { time: '19:30', label: 'Toasts / speeches', category: 'reception' },
  { time: '20:30', label: 'Cake cutting', category: 'reception' },
  { time: '20:45', label: 'Open dancing begins', category: 'reception' },
  { time: '22:30', label: 'Last dance', category: 'reception' },
  { time: '23:00', label: 'Grand exit / send-off', category: 'reception' },
]

const CATEGORY_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  prep:      { color: '#7c5cbf', bg: '#f5f0ff', label: 'Getting Ready' },
  ceremony:  { color: '#c05470', bg: '#fce9ed', label: 'Ceremony' },
  photos:    { color: '#2e7fc7', bg: '#e8f2fc', label: 'Photos' },
  reception: { color: '#3d8a56', bg: '#e8f5ec', label: 'Reception' },
  other:     { color: '#888',    bg: '#f5f5f5', label: 'Other' },
}

function fmt12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

export default function TimelinePage() {
  const { data: session } = useSession()
  const [items, setItems] = useState<TimelineItem[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<TimelineItem, 'id'>>({
    time: '12:00', label: '', category: 'other',
  })

  useEffect(() => {
    const stored = localStorage.getItem('mw_timeline')
    if (stored) {
      setItems(JSON.parse(stored))
    } else {
      const initial = DEFAULT_TIMELINE.map((t) => ({ ...t, id: crypto.randomUUID() }))
      setItems(initial)
      localStorage.setItem('mw_timeline', JSON.stringify(initial))
    }
    if (session) {
      loadFromDb('mw_timeline').then(data => {
        if (data) { setItems(data as TimelineItem[]); localStorage.setItem('mw_timeline', JSON.stringify(data)) }
      })
    }
  }, [session])

  function persist(updated: TimelineItem[]) {
    const sorted = [...updated].sort((a, b) => a.time.localeCompare(b.time))
    setItems(sorted)
    localStorage.setItem('mw_timeline', JSON.stringify(sorted))
    if (session) saveToDb('mw_timeline', sorted)
  }

  function save() {
    if (!form.label.trim()) return
    if (editingId) {
      persist(items.map((i) => (i.id === editingId ? { ...i, ...form } : i)))
      setEditingId(null)
    } else {
      persist([...items, { ...form, id: crypto.randomUUID() }])
      setAdding(false)
    }
    setForm({ time: '12:00', label: '', category: 'other' })
  }

  function startEdit(item: TimelineItem) {
    setEditingId(item.id)
    setForm({ ...item })
    setAdding(false)
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id))
  }

  const filterCats = ['all', ...Object.keys(CATEGORY_STYLES)] as const
  const [activeFilter, setActiveFilter] = useState<string>('all')
  const filtered = activeFilter === 'all' ? items : items.filter((i) => i.category === activeFilter)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      {/* Help */}
      <HelpBanner
        storageKey="timeline"
        title="How to use Day-Of Timeline"
        intro="Build a minute-by-minute schedule for the wedding day so every vendor, family member, and coordinator knows exactly what happens when."
        steps={[
          { n: 1, text: 'Click "Add Event" and set the time, label, and category (Prep, Ceremony, Photos, Reception).' },
          { n: 2, text: 'Add a location and responsible person for each event — e.g. "Florist arrives" → location: venue lobby, responsible: coordinator.' },
          { n: 3, text: 'Events are automatically sorted by time, so add them in any order.' },
          { n: 4, text: 'Share or print the final timeline and distribute to vendors, the wedding party, and family.' },
        ]}
        tips={[
          { text: 'Start with the ceremony time and work backwards (getting ready, photos) and forwards (reception, send-off).' },
          { text: 'Build in buffer time — photos almost always run long.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Clock size={18} style={{ color: 'var(--accent)' }} />
            Day-Of Timeline
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {items.length} events scheduled
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null) }}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={14} />
          Add Event
        </button>
      </div>

      {/* Category filter pills */}
      <div className="flex flex-wrap gap-2">
        {filterCats.map((cat) => {
          const style = cat === 'all' ? null : CATEGORY_STYLES[cat]
          return (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              className="px-3 py-1 rounded-lg text-xs capitalize transition-colors"
              style={{
                background: activeFilter === cat ? (style?.bg || 'var(--accent-light)') : 'var(--card)',
                border: `1px solid ${activeFilter === cat ? (style?.color || 'var(--accent)') : 'var(--border)'}`,
                color: activeFilter === cat ? (style?.color || 'var(--accent)') : 'var(--text-muted)',
                fontWeight: activeFilter === cat ? 600 : 400,
              }}
            >
              {cat === 'all' ? 'All' : style!.label}
            </button>
          )
        })}
      </div>

      {/* Add / Edit form */}
      {(adding || editingId) && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--accent)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as TimelineItem['category'] })}>
              {Object.entries(CATEGORY_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <input placeholder="Event description *" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Location (optional)" value={form.location ?? ''} onChange={(e) => setForm({ ...form, location: e.target.value })} />
            <input placeholder="Responsible person" value={form.responsible ?? ''} onChange={(e) => setForm({ ...form, responsible: e.target.value })} />
          </div>
          <input placeholder="Notes (optional)" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary text-sm">
              {editingId ? 'Save Changes' : 'Add Event'}
            </button>
            <button onClick={() => { setAdding(false); setEditingId(null) }} className="text-sm px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="flex flex-col gap-0">
        {filtered.map((item, idx) => {
          const style = CATEGORY_STYLES[item.category]
          const showTimeDivider = idx === 0 || filtered[idx - 1].time.split(':')[0] !== item.time.split(':')[0]
          return (
            <div key={item.id}>
              {showTimeDivider && idx !== 0 && <div className="h-2" />}
              <div className="flex gap-4 group">
                {/* Time column */}
                <div className="w-16 text-right shrink-0 pt-3">
                  <span className="text-xs font-mono font-medium" style={{ color: 'var(--text-muted)' }}>
                    {fmt12(item.time)}
                  </span>
                </div>

                {/* Line + dot */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-3 h-3 rounded-full mt-3.5 shrink-0" style={{ background: style.color }} />
                  {idx < filtered.length - 1 && (
                    <div className="w-0.5 flex-1 my-1" style={{ background: 'var(--border)', minHeight: 16 }} />
                  )}
                </div>

                {/* Content */}
                <div
                  className="flex-1 rounded-xl px-4 py-3 mb-2 group"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  {editingId === item.id ? null : (
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium">{item.label}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color }}>
                            {style.label}
                          </span>
                        </div>
                        {(item.location || item.responsible) && (
                          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {item.location && <span>📍 {item.location}</span>}
                            {item.location && item.responsible && <span> · </span>}
                            {item.responsible && <span>👤 {item.responsible}</span>}
                          </div>
                        )}
                        {item.notes && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.notes}</div>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => startEdit(item)} style={{ color: 'var(--accent)' }}><Edit2 size={13} /></button>
                        <button onClick={() => remove(item.id)} style={{ color: '#e0b0b8' }}><Trash2 size={13} /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
