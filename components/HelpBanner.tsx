'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X, ChevronDown, ChevronUp } from 'lucide-react'

interface Step {
  n: number
  text: string
}

interface Tip {
  text: string
}

interface Props {
  storageKey: string   // unique per page so collapsed state persists independently
  title: string
  intro?: string
  steps?: Step[]
  tips?: Tip[]
}

export default function HelpBanner({ storageKey, title, intro, steps, tips }: Props) {
  const key = `mw_help_${storageKey}`
  const [open, setOpen] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Show expanded on first visit, collapsed after that
    const seen = localStorage.getItem(key)
    if (!seen) {
      setOpen(true)
      localStorage.setItem(key, '1')
    }
  }, [key])

  function dismiss() {
    setDismissed(true)
    localStorage.setItem(key, 'dismissed')
  }

  if (dismissed) return null

  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{ border: '1px solid var(--border)', background: 'var(--accent-light)' }}
    >
      {/* Header row — always visible */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 flex-1 text-left"
        >
          <HelpCircle size={15} style={{ color: 'var(--accent)', flexShrink: 0 }} />
          <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>{title}</span>
          {open ? <ChevronUp size={13} style={{ color: 'var(--accent)', marginLeft: 'auto' }} />
                 : <ChevronDown size={13} style={{ color: 'var(--accent)', marginLeft: 'auto' }} />}
        </button>
        <button onClick={dismiss} title="Dismiss" style={{ color: 'var(--text-muted)' }}>
          <X size={14} />
        </button>
      </div>

      {/* Expandable body */}
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: 'rgba(192,84,112,0.15)' }}>
          {intro && (
            <p className="text-sm pt-3" style={{ color: 'var(--text-muted)' }}>{intro}</p>
          )}

          {steps && steps.length > 0 && (
            <ol className="flex flex-col gap-2">
              {steps.map((s) => (
                <li key={s.n} className="flex gap-3 text-sm">
                  <span
                    className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
                    style={{ width: 22, height: 22, background: 'var(--accent)', color: '#fff', marginTop: 1 }}
                  >
                    {s.n}
                  </span>
                  <span style={{ color: 'var(--text)' }}>{s.text}</span>
                </li>
              ))}
            </ol>
          )}

          {tips && tips.length > 0 && (
            <ul className="flex flex-col gap-1.5 mt-1">
              {tips.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span style={{ color: 'var(--accent)', flexShrink: 0 }}>•</span>
                  <span style={{ color: 'var(--text-muted)' }}>{t.text}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
