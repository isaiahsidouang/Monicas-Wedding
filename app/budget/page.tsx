'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import HelpBanner from '@/components/HelpBanner'
import type { BudgetItem } from '@/types'

const DEFAULT_BUDGET: Omit<BudgetItem, 'id'>[] = [
  { category: 'Venue & Catering', description: 'Venue rental fee', estimated: 0, actual: 0, paid: 0 },
  { category: 'Venue & Catering', description: 'Catering / F&B minimum', estimated: 0, actual: 0, paid: 0 },
  { category: 'Photography', description: 'Wedding photographer', estimated: 0, actual: 0, paid: 0 },
  { category: 'Videography', description: 'Wedding videographer', estimated: 0, actual: 0, paid: 0 },
  { category: 'Flowers & Decor', description: 'Florals & centerpieces', estimated: 0, actual: 0, paid: 0 },
  { category: 'Flowers & Decor', description: 'Lighting & décor rentals', estimated: 0, actual: 0, paid: 0 },
  { category: 'Music', description: 'Band or DJ', estimated: 0, actual: 0, paid: 0 },
  { category: 'Attire', description: 'Wedding dress & alterations', estimated: 0, actual: 0, paid: 0 },
  { category: 'Attire', description: 'Bridesmaids & groomsmen attire', estimated: 0, actual: 0, paid: 0 },
  { category: 'Hair & Makeup', description: 'Bride hair & makeup', estimated: 0, actual: 0, paid: 0 },
  { category: 'Hair & Makeup', description: 'Bridal party hair & makeup', estimated: 0, actual: 0, paid: 0 },
  { category: 'Cake & Desserts', description: 'Wedding cake', estimated: 0, actual: 0, paid: 0 },
  { category: 'Transportation', description: 'Limo / car service', estimated: 0, actual: 0, paid: 0 },
  { category: 'Transportation', description: 'Guest shuttles', estimated: 0, actual: 0, paid: 0 },
  { category: 'Stationery', description: 'Invitations & save-the-dates', estimated: 0, actual: 0, paid: 0 },
  { category: 'Stationery', description: 'Programs, menus & signage', estimated: 0, actual: 0, paid: 0 },
  { category: 'Officiant', description: 'Officiant fee', estimated: 0, actual: 0, paid: 0 },
  { category: 'Rehearsal Dinner', description: 'Rehearsal dinner venue & food', estimated: 0, actual: 0, paid: 0 },
  { category: 'Gifts & Favors', description: 'Wedding favors', estimated: 0, actual: 0, paid: 0 },
  { category: 'Gifts & Favors', description: 'Bridal party & parent gifts', estimated: 0, actual: 0, paid: 0 },
  { category: 'Miscellaneous', description: 'Vendor tips (gratuity)', estimated: 0, actual: 0, paid: 0 },
  { category: 'Miscellaneous', description: 'Contingency / emergency fund', estimated: 0, actual: 0, paid: 0 },
]

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function BudgetPage() {
  const [items, setItems] = useState<BudgetItem[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<BudgetItem>>({})
  const [adding, setAdding] = useState(false)
  const [newItem, setNewItem] = useState({ category: '', description: '', estimated: 0, actual: 0, paid: 0, vendor: '', notes: '' })

  useEffect(() => {
    // v2: wipe the old auto-seeded $198k and start fresh
    if (localStorage.getItem('mw_budget_version') !== 'v2') {
      localStorage.removeItem('mw_budget')
      localStorage.setItem('mw_budget_version', 'v2')
    }
    const stored = localStorage.getItem('mw_budget')
    if (stored) {
      setItems(JSON.parse(stored))
    } else {
      const initial = DEFAULT_BUDGET.map((b) => ({ ...b, id: crypto.randomUUID() }))
      setItems(initial)
      localStorage.setItem('mw_budget', JSON.stringify(initial))
    }
  }, [])

  function persist(updated: BudgetItem[]) {
    setItems(updated)
    localStorage.setItem('mw_budget', JSON.stringify(updated))
  }

  function startEdit(item: BudgetItem) {
    setEditingId(item.id)
    setEditData({ ...item })
  }

  function saveEdit() {
    persist(items.map((i) => (i.id === editingId ? { ...i, ...editData } : i)))
    setEditingId(null)
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id))
  }

  function addItem() {
    if (!newItem.description.trim()) return
    persist([...items, { ...newItem, id: crypto.randomUUID() }])
    setNewItem({ category: '', description: '', estimated: 0, actual: 0, paid: 0, vendor: '', notes: '' })
    setAdding(false)
  }

  const totalEstimated = items.reduce((s, i) => s + (i.estimated || 0), 0)
  const totalActual = items.reduce((s, i) => s + (i.actual || 0), 0)
  const totalPaid = items.reduce((s, i) => s + (i.paid || 0), 0)
  const remaining = totalActual - totalPaid

  const categories = [...new Set(items.map((i) => i.category))]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Help */}
      <HelpBanner
        storageKey="budget"
        title="How to use Budget Tracker"
        steps={[
          { n: 1, text: 'Click "Add Line" to create a budget category (e.g. Venue, Catering, Flowers, Photography).' },
          { n: 2, text: 'Enter the Estimated cost upfront — this is your target/cap for that category.' },
          { n: 3, text: 'As you get quotes and make payments, fill in Actual cost and Paid so far.' },
          { n: 4, text: 'The summary bar at the top shows total estimated vs. total paid at a glance.' },
        ]}
        tips={[
          { text: 'Monica\'s venue budget cap is $115,000 — add that as your Venue line first.' },
          { text: 'Estimated vs. Actual difference shows you where you\'re over or under budget.' },
        ]}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <DollarSign size={18} style={{ color: 'var(--accent)' }} />
          Budget Tracker
        </h1>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={14} />
          Add Line
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Estimated Total', value: fmt(totalEstimated), color: 'var(--text-muted)' },
          { label: 'Actual Total', value: fmt(totalActual), color: totalActual > totalEstimated ? '#c05470' : '#5a9e6f' },
          { label: 'Paid So Far', value: fmt(totalPaid), color: '#5a9e6f' },
          { label: 'Still Owed', value: fmt(remaining), color: remaining > 0 ? '#c9874a' : 'var(--text-muted)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {adding && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
            <input placeholder="Description" value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Estimated $" value={newItem.estimated || ''} onChange={(e) => setNewItem({ ...newItem, estimated: Number(e.target.value) })} />
            <input type="number" placeholder="Actual $" value={newItem.actual || ''} onChange={(e) => setNewItem({ ...newItem, actual: Number(e.target.value) })} />
            <input type="number" placeholder="Paid $" value={newItem.paid || ''} onChange={(e) => setNewItem({ ...newItem, paid: Number(e.target.value) })} />
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary text-sm">Add</button>
            <button onClick={() => setAdding(false)} className="text-sm px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table by category */}
      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category === cat)
        const catEst = catItems.reduce((s, i) => s + (i.estimated || 0), 0)
        const catActual = catItems.reduce((s, i) => s + (i.actual || 0), 0)
        return (
          <div key={cat} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-2.5" style={{ background: '#fdf2f4' }}>
              <span className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>{cat}</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {fmt(catEst)} est · {fmt(catActual)} actual
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
              {catItems.map((item) => (
                <div key={item.id} className="px-4 py-3 group">
                  {editingId === item.id ? (
                    <div className="flex flex-col gap-2">
                      <div className="grid grid-cols-3 gap-2">
                        <input placeholder="Estimated" type="number" value={editData.estimated ?? ''} onChange={(e) => setEditData({ ...editData, estimated: Number(e.target.value) })} />
                        <input placeholder="Actual" type="number" value={editData.actual ?? ''} onChange={(e) => setEditData({ ...editData, actual: Number(e.target.value) })} />
                        <input placeholder="Paid" type="number" value={editData.paid ?? ''} onChange={(e) => setEditData({ ...editData, paid: Number(e.target.value) })} />
                      </div>
                      <input placeholder="Vendor" value={editData.vendor ?? ''} onChange={(e) => setEditData({ ...editData, vendor: e.target.value })} />
                      <input placeholder="Notes" value={editData.notes ?? ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} />
                      <div className="flex gap-2">
                        <button onClick={saveEdit} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: 'var(--accent)', color: '#fff' }}>
                          <Check size={12} /> Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium">{item.description}</div>
                        {item.vendor && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.vendor}</div>}
                        {item.notes && <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.notes}</div>}
                      </div>
                      <div className="flex items-center gap-4 text-sm shrink-0">
                        <div className="text-right">
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Est.</div>
                          <div>{item.estimated ? fmt(item.estimated) : '—'}</div>
                        </div>
                        <div className="text-right">
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Actual</div>
                          <div style={{ color: item.actual > item.estimated ? '#c05470' : 'inherit' }}>
                            {item.actual ? fmt(item.actual) : '—'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Paid</div>
                          <div style={{ color: '#5a9e6f' }}>{item.paid ? fmt(item.paid) : '—'}</div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(item)} style={{ color: 'var(--accent)' }}><Edit2 size={14} /></button>
                          <button onClick={() => remove(item.id)} style={{ color: '#e0b0b8' }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
