'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import type { VendorRecord, VendorCategory } from '@/types'

const CATEGORIES: VendorCategory[] = [
  'Photographer', 'Videographer', 'Florist', 'Band / DJ',
  'Hair & Makeup', 'Officiant', 'Catering', 'Cake / Desserts',
  'Transportation', 'Invitations', 'Rentals', 'Other',
]

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  researching:       { bg: '#f5f0ff', color: '#7c5cbf', label: 'Researching' },
  contacted:         { bg: '#fff8e6', color: '#b87c2a', label: 'Contacted' },
  'proposal-received': { bg: '#fce9ed', color: '#c05470', label: 'Proposal Received' },
  booked:            { bg: '#e8f5ec', color: '#3d8a56', label: 'Booked ✓' },
  declined:          { bg: '#f5f5f5', color: '#888', label: 'Declined' },
}

const EMPTY_VENDOR: Omit<VendorRecord, 'id' | 'createdAt'> = {
  category: 'Photographer',
  name: '',
  contact: {},
  status: 'researching',
  priority: '',
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<VendorRecord>>({})
  const [adding, setAdding] = useState(false)
  const [newVendor, setNewVendor] = useState<Omit<VendorRecord, 'id' | 'createdAt'>>(EMPTY_VENDOR)
  const [filterCat, setFilterCat] = useState<string>('all')

  useEffect(() => {
    const stored = localStorage.getItem('mw_vendors')
    if (stored) setVendors(JSON.parse(stored))
  }, [])

  function persist(updated: VendorRecord[]) {
    setVendors(updated)
    localStorage.setItem('mw_vendors', JSON.stringify(updated))
  }

  function addVendor() {
    if (!newVendor.name.trim()) return
    persist([...vendors, { ...newVendor, id: crypto.randomUUID(), createdAt: new Date().toISOString() }])
    setNewVendor(EMPTY_VENDOR)
    setAdding(false)
  }

  function startEdit(v: VendorRecord) {
    setEditingId(v.id)
    setEditData({ ...v })
  }

  function saveEdit() {
    persist(vendors.map((v) => (v.id === editingId ? { ...v, ...editData } : v)))
    setEditingId(null)
  }

  function remove(id: string) {
    persist(vendors.filter((v) => v.id !== id))
  }

  const filtered = filterCat === 'all' ? vendors : vendors.filter((v) => v.category === filterCat)
  const booked = vendors.filter((v) => v.status === 'booked').length
  const usedCats = [...new Set(vendors.map((v) => v.category))]

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <Users size={18} style={{ color: 'var(--accent)' }} />
            Vendor Tracker
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {booked} of {vendors.length} vendors booked
          </p>
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={14} />
          Add Vendor
        </button>
      </div>

      {/* Category filter */}
      {usedCats.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterCat('all')}
            className="px-3 py-1 rounded-lg text-xs transition-colors"
            style={{
              background: filterCat === 'all' ? 'var(--accent-light)' : 'var(--card)',
              border: `1px solid ${filterCat === 'all' ? 'var(--accent)' : 'var(--border)'}`,
              color: filterCat === 'all' ? 'var(--accent)' : 'var(--text-muted)',
            }}
          >
            All ({vendors.length})
          </button>
          {usedCats.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className="px-3 py-1 rounded-lg text-xs transition-colors"
              style={{
                background: filterCat === cat ? 'var(--accent-light)' : 'var(--card)',
                border: `1px solid ${filterCat === cat ? 'var(--accent)' : 'var(--border)'}`,
                color: filterCat === cat ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-2">
            <select value={newVendor.category} onChange={(e) => setNewVendor({ ...newVendor, category: e.target.value as VendorCategory })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Vendor name *" value={newVendor.name} onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input placeholder="Contact name" value={newVendor.contact.name ?? ''} onChange={(e) => setNewVendor({ ...newVendor, contact: { ...newVendor.contact, name: e.target.value } })} />
            <input placeholder="Email" value={newVendor.contact.email ?? ''} onChange={(e) => setNewVendor({ ...newVendor, contact: { ...newVendor.contact, email: e.target.value } })} />
            <input placeholder="Phone" value={newVendor.contact.phone ?? ''} onChange={(e) => setNewVendor({ ...newVendor, contact: { ...newVendor.contact, phone: e.target.value } })} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <select value={newVendor.status} onChange={(e) => setNewVendor({ ...newVendor, status: e.target.value as VendorRecord['status'] })}>
              {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <input type="number" placeholder="Price $" value={newVendor.price ?? ''} onChange={(e) => setNewVendor({ ...newVendor, price: Number(e.target.value) })} />
            <select value={newVendor.priority} onChange={(e) => setNewVendor({ ...newVendor, priority: e.target.value as VendorRecord['priority'] })}>
              <option value="">Priority</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
          <textarea placeholder="Notes" rows={2} value={newVendor.notes ?? ''} onChange={(e) => setNewVendor({ ...newVendor, notes: e.target.value })} className="resize-none" />
          <div className="flex gap-2">
            <button onClick={addVendor} className="btn-primary text-sm">Add Vendor</button>
            <button onClick={() => setAdding(false)} className="text-sm px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Vendor cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          No vendors yet — click &ldquo;Add Vendor&rdquo; to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((vendor) => {
            const style = STATUS_STYLES[vendor.status]
            return editingId === vendor.id ? (
              <div key={vendor.id} className="rounded-xl p-4 flex flex-col gap-2" style={{ background: 'var(--card)', border: '1px solid var(--accent)' }}>
                <div className="grid grid-cols-2 gap-2">
                  <select value={editData.category} onChange={(e) => setEditData({ ...editData, category: e.target.value as VendorCategory })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input value={editData.name ?? ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <input placeholder="Email" value={editData.contact?.email ?? ''} onChange={(e) => setEditData({ ...editData, contact: { ...editData.contact, email: e.target.value } })} />
                <input placeholder="Phone" value={editData.contact?.phone ?? ''} onChange={(e) => setEditData({ ...editData, contact: { ...editData.contact, phone: e.target.value } })} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={editData.status} onChange={(e) => setEditData({ ...editData, status: e.target.value as VendorRecord['status'] })}>
                    {Object.entries(STATUS_STYLES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input type="number" placeholder="Price $" value={editData.price ?? ''} onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })} />
                </div>
                <textarea rows={2} placeholder="Notes" value={editData.notes ?? ''} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} className="resize-none" />
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
              <div key={vendor.id} className="rounded-xl p-4 flex flex-col gap-2 group" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-sm">{vendor.name}</div>
                    <div className="text-xs" style={{ color: 'var(--accent)' }}>{vendor.category}</div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: style.bg, color: style.color }}>{style.label}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(vendor)} style={{ color: 'var(--accent)' }}><Edit2 size={13} /></button>
                      <button onClick={() => remove(vendor.id)} style={{ color: '#e0b0b8' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
                {(vendor.contact.email || vendor.contact.phone) && (
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {vendor.contact.name && <span>{vendor.contact.name} · </span>}
                    {vendor.contact.email && <span>{vendor.contact.email}</span>}
                    {vendor.contact.phone && <span> · {vendor.contact.phone}</span>}
                  </div>
                )}
                {vendor.price && (
                  <div className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    ${vendor.price.toLocaleString()}
                  </div>
                )}
                {vendor.notes && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{vendor.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
