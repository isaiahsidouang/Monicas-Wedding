'use client'

import { useState, useEffect } from 'react'
import { CheckSquare, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import type { ChecklistItem } from '@/types'

const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'id' | 'completed'>[] = [
  // 12+ months
  { category: 'Venue & Logistics', task: 'Set overall wedding budget', timeframe: '12+ months', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Create preliminary guest list', timeframe: '12+ months', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Book wedding venue', timeframe: '12+ months', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Set wedding date', timeframe: '12+ months', priority: 'high' },
  // 9–11 months
  { category: 'Vendors', task: 'Book photographer', timeframe: '9–11 months', priority: 'high' },
  { category: 'Vendors', task: 'Book videographer', timeframe: '9–11 months', priority: 'high' },
  { category: 'Vendors', task: 'Book caterer (if not included with venue)', timeframe: '9–11 months', priority: 'high' },
  { category: 'Attire', task: 'Start wedding dress shopping', timeframe: '9–11 months', priority: 'high' },
  { category: 'Wedding Party', task: 'Choose bridesmaids & groomsmen', timeframe: '9–11 months', priority: 'medium' },
  // 6–8 months
  { category: 'Vendors', task: 'Book florist', timeframe: '6–8 months', priority: 'high' },
  { category: 'Vendors', task: 'Book band or DJ', timeframe: '6–8 months', priority: 'high' },
  { category: 'Vendors', task: 'Book hair & makeup artist', timeframe: '6–8 months', priority: 'high' },
  { category: 'Vendors', task: 'Book officiant', timeframe: '6–8 months', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Book hotel room blocks for guests', timeframe: '6–8 months', priority: 'medium' },
  { category: 'Stationery', task: 'Design & order save-the-dates', timeframe: '6–8 months', priority: 'medium' },
  { category: 'Attire', task: 'Order wedding dress', timeframe: '6–8 months', priority: 'high' },
  { category: 'Attire', task: 'Choose bridesmaids dresses', timeframe: '6–8 months', priority: 'medium' },
  // 4–5 months
  { category: 'Stationery', task: 'Send invitations', timeframe: '4–5 months', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Finalize ceremony & reception details with venue', timeframe: '4–5 months', priority: 'high' },
  { category: 'Vendors', task: 'Book rehearsal dinner venue', timeframe: '4–5 months', priority: 'medium' },
  { category: 'Vendors', task: 'Book wedding cake / desserts', timeframe: '4–5 months', priority: 'medium' },
  { category: 'Vendors', task: 'Book transportation (limo, shuttle, etc.)', timeframe: '4–5 months', priority: 'medium' },
  { category: 'Attire', task: 'Finalize groomsmen attire', timeframe: '4–5 months', priority: 'medium' },
  // 2–3 months
  { category: 'Vendors', task: 'Finalize menu with caterer', timeframe: '2–3 months', priority: 'high' },
  { category: 'Vendors', task: 'Confirm all vendor bookings', timeframe: '2–3 months', priority: 'high' },
  { category: 'Attire', task: 'First wedding dress fitting', timeframe: '2–3 months', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Create seating chart', timeframe: '2–3 months', priority: 'medium' },
  { category: 'Venue & Logistics', task: 'Plan ceremony processional & music', timeframe: '2–3 months', priority: 'medium' },
  { category: 'Stationery', task: 'Order programs, menus, and signage', timeframe: '2–3 months', priority: 'low' },
  // 1 month
  { category: 'Venue & Logistics', task: 'Final RSVP headcount due', timeframe: '1 month', priority: 'high' },
  { category: 'Vendors', task: 'Final payments to all vendors', timeframe: '1 month', priority: 'high' },
  { category: 'Attire', task: 'Final dress fitting', timeframe: '1 month', priority: 'high' },
  { category: 'Venue & Logistics', task: 'Prepare vendor tips (cash envelopes)', timeframe: '1 month', priority: 'medium' },
  { category: 'Venue & Logistics', task: 'Create & distribute day-of timeline', timeframe: '1 month', priority: 'high' },
  // Week of
  { category: 'Week Of', task: 'Wedding rehearsal', timeframe: '1 week', priority: 'high' },
  { category: 'Week Of', task: 'Rehearsal dinner', timeframe: '1 week', priority: 'high' },
  { category: 'Week Of', task: 'Confirm final details with all vendors', timeframe: '1 week', priority: 'high' },
  { category: 'Week Of', task: 'Pick up wedding dress', timeframe: '1 week', priority: 'high' },
  { category: 'Week Of', task: 'Prepare emergency kit (safety pins, stain remover, etc.)', timeframe: '1 week', priority: 'medium' },
  { category: 'Week Of', task: 'Delegate tasks to wedding party / coordinator', timeframe: '1 week', priority: 'medium' },
  // Day before / day of
  { category: 'Day Of', task: 'Get a good night\'s sleep 💕', timeframe: 'Day before', priority: 'high' },
  { category: 'Day Of', task: 'Hair & makeup', timeframe: 'Day of', priority: 'high' },
  { category: 'Day Of', task: 'Get dressed & first look (optional)', timeframe: 'Day of', priority: 'high' },
  { category: 'Day Of', task: 'Have someone hold phone, rings, and bouquet', timeframe: 'Day of', priority: 'high' },
  { category: 'Day Of', task: 'Enjoy every moment 🎉', timeframe: 'Day of', priority: 'high' },
]

const TIMEFRAME_ORDER = [
  '12+ months', '9–11 months', '6–8 months', '4–5 months',
  '2–3 months', '1 month', '1 week', 'Day before', 'Day of',
]

const PRIORITY_COLORS = { high: '#c05470', medium: '#c9874a', low: '#7a9e7e' }

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [newTask, setNewTask] = useState<{ task: string; category: string; timeframe: string; priority: 'high' | 'medium' | 'low' }>({ task: '', category: '', timeframe: '4–5 months', priority: 'medium' })
  const [filter, setFilter] = useState<'all' | 'pending' | 'done'>('all')

  useEffect(() => {
    const stored = localStorage.getItem('mw_checklist')
    if (stored) {
      setItems(JSON.parse(stored))
    } else {
      const initial = DEFAULT_CHECKLIST.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        completed: false,
      }))
      setItems(initial)
      localStorage.setItem('mw_checklist', JSON.stringify(initial))
    }
  }, [])

  function persist(updated: ChecklistItem[]) {
    setItems(updated)
    localStorage.setItem('mw_checklist', JSON.stringify(updated))
  }

  function toggle(id: string) {
    persist(items.map((i) => (i.id === id ? { ...i, completed: !i.completed } : i)))
  }

  function remove(id: string) {
    persist(items.filter((i) => i.id !== id))
  }

  function addItem() {
    if (!newTask.task.trim()) return
    const item: ChecklistItem = {
      id: crypto.randomUUID(),
      ...newTask,
      completed: false,
    }
    persist([...items, item])
    setNewTask({ task: '', category: '', timeframe: '4–5 months', priority: 'medium' })
    setAdding(false)
  }

  function toggleCollapse(tf: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(tf)) next.delete(tf)
      else next.add(tf)
      return next
    })
  }

  const filtered = items.filter((i) => {
    if (filter === 'pending') return !i.completed
    if (filter === 'done') return i.completed
    return true
  })

  const grouped = TIMEFRAME_ORDER.reduce<Record<string, ChecklistItem[]>>((acc, tf) => {
    const group = filtered.filter((i) => i.timeframe === tf)
    if (group.length > 0) acc[tf] = group
    return acc
  }, {})

  const totalDone = items.filter((i) => i.completed).length
  const pct = items.length > 0 ? Math.round((totalDone / items.length) * 100) : 0

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <CheckSquare size={18} style={{ color: 'var(--accent)' }} />
            Wedding Checklist
          </h1>
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg font-medium"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Plus size={14} />
            Add Task
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--text-muted)' }}>{totalDone} of {items.length} tasks complete</span>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{pct}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ background: 'var(--accent-light)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${pct}%`, background: 'var(--accent)' }}
            />
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-1 rounded-lg p-1 self-start" style={{ background: '#f9f0f2', border: '1px solid var(--border)' }}>
          {(['all', 'pending', 'done'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-md text-sm capitalize transition-colors"
              style={{
                background: filter === f ? 'var(--accent-light)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
                fontWeight: filter === f ? 600 : 400,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Add task form */}
      {adding && (
        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <input
            placeholder="Task description"
            value={newTask.task}
            onChange={(e) => setNewTask({ ...newTask, task: e.target.value })}
            className="w-full"
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              placeholder="Category"
              value={newTask.category}
              onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
            />
            <select value={newTask.timeframe} onChange={(e) => setNewTask({ ...newTask, timeframe: e.target.value })}>
              {TIMEFRAME_ORDER.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
            </select>
            <select value={newTask.priority} onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as 'high' | 'medium' | 'low' })}>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="btn-primary text-sm">Add</button>
            <button onClick={() => setAdding(false)} className="text-sm px-4 py-2 rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Grouped checklist */}
      {Object.entries(grouped).map(([timeframe, groupItems]) => {
        const donePct = Math.round((groupItems.filter((i) => i.completed).length / groupItems.length) * 100)
        const isCollapsed = collapsed.has(timeframe)
        return (
          <div key={timeframe} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => toggleCollapse(timeframe)}
              className="w-full flex items-center justify-between px-4 py-3"
              style={{ background: '#fdf2f4' }}
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>{timeframe}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                  {groupItems.filter((i) => i.completed).length}/{groupItems.length} done · {donePct}%
                </span>
              </div>
              {isCollapsed ? <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} /> : <ChevronUp size={15} style={{ color: 'var(--text-muted)' }} />}
            </button>

            {!isCollapsed && (
              <div className="divide-y" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {groupItems.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 px-4 py-3 group">
                    <button
                      onClick={() => toggle(item.id)}
                      className="mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
                      style={{
                        borderColor: item.completed ? 'var(--accent)' : 'var(--border)',
                        background: item.completed ? 'var(--accent)' : '#fff',
                      }}
                    >
                      {item.completed && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm"
                          style={{
                            color: item.completed ? 'var(--text-muted)' : 'var(--text)',
                            textDecoration: item.completed ? 'line-through' : 'none',
                          }}
                        >
                          {item.task}
                        </span>
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ background: `${PRIORITY_COLORS[item.priority]}18`, color: PRIORITY_COLORS[item.priority] }}
                        >
                          {item.priority}
                        </span>
                      </div>
                      {item.category && (
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.category}</span>
                      )}
                    </div>
                    <button
                      onClick={() => remove(item.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: '#e0b0b8' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
