'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { loadFromDb, saveToDb } from '@/lib/db-client'
import { FileCheck, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react'
import HelpBanner from '@/components/HelpBanner'
import type { ContractRecord } from '@/types'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const EMPTY: Omit<ContractRecord, 'id' | 'createdAt'> = {
  vendorName: '',
  category: '',
  totalAmount: 0,
  depositAmount: 0,
  depositPaid: false,
  remainingBalance: 0,
  contractSigned: false,
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function ContractsPage() {
  const { data: session } = useSession()
  const [contracts, setContracts] = useState<ContractRecord[]>([])
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<ContractRecord, 'id' | 'createdAt'>>(EMPTY)

  useEffect(() => {
    const stored = localStorage.getItem('mw_contracts')
    if (stored) setContracts(JSON.parse(stored))
    if (session) {
      loadFromDb('mw_contracts').then(data => {
        if (data) { setContracts(data as ContractRecord[]); localStorage.setItem('mw_contracts', JSON.stringify(data)) }
      })
    }
  }, [session])

  function persist(updated: ContractRecord[]) {
    setContracts(updated)
    localStorage.setItem('mw_contracts', JSON.stringify(updated))
    if (session) saveToDb('mw_contracts', updated)
  }

  function save() {
    if (!form.vendorName.trim()) return
    const remaining = form.totalAmount - form.depositAmount
    if (editingId) {
      persist(contracts.map((c) => (c.id === editingId ? { ...c, ...form, remainingBalance: remaining } : c)))
      setEditingId(null)
    } else {
      persist([...contracts, { ...form, remainingBalance: remaining, id: crypto.randomUUID(), createdAt: new Date().toISOString() }])
      setAdding(false)
    }
    setForm(EMPTY)
  }

  function startEdit(c: ContractRecord) {
    setEditingId(c.id)
    setForm({ ...c })
    setAdding(false)
  }

  function remove(id: string) {
    persist(contracts.filter((c) => c.id !== id))
  }

  function toggleField(id: string, field: 'contractSigned' | 'depositPaid') {
    persist(contracts.map((c) => (c.id === id ? { ...c, [field]: !c[field] } : c)))
  }

  const totalOwed = contracts.reduce((s, c) => s + c.remainingBalance, 0)
  const totalPaid = contracts.reduce((s, c) => s + (c.depositPaid ? c.depositAmount : 0), 0)
  const signed = contracts.filter((c) => c.contractSigned).length
  const overdue = contracts.filter((c) => {
    const d = daysUntil(c.balanceDueDate)
    return d !== null && d < 0 && !c.contractSigned
  })
  const upcoming = contracts.filter((c) => {
    const d = daysUntil(c.balanceDueDate)
    return d !== null && d >= 0 && d <= 30
  })

  const showForm = adding || editingId !== null

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      {/* Help */}
      <HelpBanner
        storageKey="contracts"
        title="How to use Contracts & Deposits"
        steps={[
          { n: 1, text: 'Add a contract entry as soon as a vendor or venue sends a contract to sign.' },
          { n: 2, text: 'Record the total amount, deposit amount, and deposit due date so nothing slips through.' },
          { n: 3, text: 'Check "Deposit Paid" and "Contract Signed" as each is completed.' },
          { n: 4, text: 'Set a balance due date for the remaining payment — the card will highlight it when it\'s upcoming.' },
        ]}
        tips={[
          { text: 'Pending contracts (unsigned or unpaid deposit) show on the Home dashboard as a reminder.' },
          { text: 'Add the venue contract first — it usually has the earliest deposit deadline.' },
        ]}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <FileCheck size={18} style={{ color: 'var(--accent)' }} />
            Contracts & Deposits
          </h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {signed}/{contracts.length} contracts signed
          </p>
        </div>
        <button
          onClick={() => { setAdding(true); setEditingId(null); setForm(EMPTY) }}
          className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <Plus size={14} />
          Add Contract
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Paid', value: fmt(totalPaid), color: '#3d8a56' },
          { label: 'Still Owed', value: fmt(totalOwed), color: '#c9874a' },
          { label: 'Due Soon (30d)', value: upcoming.length, color: upcoming.length > 0 ? '#c05470' : 'var(--text-muted)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl p-4 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="text-xl font-bold" style={{ color }}>{value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Overdue alerts */}
      {overdue.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: '#fff0f0', border: '1px solid #f5b0b0' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c05470' }}>
            <AlertCircle size={15} />
            Overdue Payments
          </div>
          {overdue.map((c) => (
            <div key={c.id} className="text-sm flex justify-between">
              <span style={{ color: 'var(--text)' }}>{c.vendorName}</span>
              <span style={{ color: '#c05470' }}>
                {fmt(c.remainingBalance)} — was due {c.balanceDueDate}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Due soon alerts */}
      {upcoming.length > 0 && (
        <div className="rounded-xl p-4 flex flex-col gap-2" style={{ background: '#fff8f0', border: '1px solid #f5d4b0' }}>
          <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#c9874a' }}>
            <AlertCircle size={15} />
            Payments Due Soon
          </div>
          {upcoming.map((c) => (
            <div key={c.id} className="flex justify-between text-sm">
              <span>{c.vendorName}</span>
              <span style={{ color: '#c9874a' }}>
                {fmt(c.remainingBalance)} due {c.balanceDueDate} ({daysUntil(c.balanceDueDate)} days)
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit form */}
      {showForm && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--accent)' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            {editingId ? 'Edit Contract' : 'Add Contract'}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Vendor name *" value={form.vendorName} onChange={(e) => setForm({ ...form, vendorName: e.target.value })} />
            <input placeholder="Category (e.g. Photographer)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Total amount $" value={form.totalAmount || ''} onChange={(e) => setForm({ ...form, totalAmount: Number(e.target.value) })} />
            <input type="number" placeholder="Deposit amount $" value={form.depositAmount || ''} onChange={(e) => setForm({ ...form, depositAmount: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="date" placeholder="Deposit due date" value={form.depositDueDate ?? ''} onChange={(e) => setForm({ ...form, depositDueDate: e.target.value })} />
            <input type="date" placeholder="Balance due date" value={form.balanceDueDate ?? ''} onChange={(e) => setForm({ ...form, balanceDueDate: e.target.value })} />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.contractSigned} onChange={(e) => setForm({ ...form, contractSigned: e.target.checked })} />
              Contract signed
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.depositPaid} onChange={(e) => setForm({ ...form, depositPaid: e.target.checked })} />
              Deposit paid
            </label>
          </div>
          <textarea rows={2} placeholder="Notes" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="resize-none" />
          <div className="flex gap-2">
            <button onClick={save} className="btn-primary text-sm">
              {editingId ? 'Save Changes' : 'Add Contract'}
            </button>
            <button onClick={() => { setAdding(false); setEditingId(null); setForm(EMPTY) }} className="text-sm px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Contract list */}
      {contracts.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          No contracts yet — add one above.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {contracts.map((c) => {
            const daysToBalance = daysUntil(c.balanceDueDate)
            const urgent = daysToBalance !== null && daysToBalance >= 0 && daysToBalance <= 14
            return (
              <div
                key={c.id}
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: 'var(--card)', border: `1px solid ${urgent ? '#f5d4b0' : 'var(--border)'}` }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{c.vendorName}</div>
                    {c.category && <div className="text-xs" style={{ color: 'var(--accent)' }}>{c.category}</div>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{fmt(c.totalAmount)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(c)} style={{ color: 'var(--accent)' }}><Edit2 size={14} /></button>
                      <button onClick={() => remove(c.id)} style={{ color: '#e0b0b8' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {/* Contract signed */}
                  <button
                    onClick={() => toggleField(c.id, 'contractSigned')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                    style={{
                      background: c.contractSigned ? '#e8f5ec' : '#fdf2f4',
                      border: `1px solid ${c.contractSigned ? '#b0d4bc' : 'var(--border)'}`,
                    }}
                  >
                    <span style={{ color: c.contractSigned ? '#3d8a56' : '#c05470' }}>
                      {c.contractSigned ? '✓' : '○'}
                    </span>
                    <span style={{ color: c.contractSigned ? '#3d8a56' : 'var(--text-muted)' }}>
                      {c.contractSigned ? 'Contract Signed' : 'Contract Pending'}
                    </span>
                  </button>

                  {/* Deposit paid */}
                  <button
                    onClick={() => toggleField(c.id, 'depositPaid')}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors"
                    style={{
                      background: c.depositPaid ? '#e8f5ec' : '#fdf2f4',
                      border: `1px solid ${c.depositPaid ? '#b0d4bc' : 'var(--border)'}`,
                    }}
                  >
                    <span style={{ color: c.depositPaid ? '#3d8a56' : '#c05470' }}>
                      {c.depositPaid ? '✓' : '○'}
                    </span>
                    <span style={{ color: c.depositPaid ? '#3d8a56' : 'var(--text-muted)' }}>
                      {c.depositPaid ? `Deposit Paid (${fmt(c.depositAmount)})` : `Deposit Due: ${fmt(c.depositAmount)}`}
                    </span>
                  </button>
                </div>

                {/* Balance due */}
                {c.remainingBalance > 0 && (
                  <div className="flex justify-between text-sm px-1">
                    <span style={{ color: 'var(--text-muted)' }}>Balance remaining:</span>
                    <span style={{ color: urgent ? '#c9874a' : 'var(--text)', fontWeight: 600 }}>
                      {fmt(c.remainingBalance)}
                      {c.balanceDueDate && ` · due ${c.balanceDueDate}`}
                      {daysToBalance !== null && daysToBalance >= 0 && (
                        <span style={{ color: urgent ? '#c9874a' : 'var(--text-muted)' }}>
                          {' '}({daysToBalance}d)
                        </span>
                      )}
                    </span>
                  </div>
                )}

                {c.notes && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.notes}</p>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
