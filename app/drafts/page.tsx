'use client'

import { useState, useEffect } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { loadFromDb, saveToDb } from '@/lib/db-client'
import { FileText, LogIn, CheckCheck } from 'lucide-react'
import HelpBanner from '@/components/HelpBanner'
import DraftCard from '@/components/DraftCard'
import type { DraftEmail } from '@/types'

export default function DraftsPage() {
  const { data: session } = useSession()
  const [drafts, setDrafts] = useState<DraftEmail[]>([])
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent-to-drafts'>('all')

  useEffect(() => {
    const stored = localStorage.getItem('mw_drafts')
    if (stored) setDrafts(JSON.parse(stored))
    if (session) {
      loadFromDb('mw_drafts').then(data => {
        if (data) { setDrafts(data as DraftEmail[]); localStorage.setItem('mw_drafts', JSON.stringify(data)) }
      })
    }
  }, [session])

  function persist(updated: DraftEmail[]) {
    setDrafts(updated)
    localStorage.setItem('mw_drafts', JSON.stringify(updated))
    if (session) saveToDb('mw_drafts', updated)
  }

  function updateDraft(id: string, updates: Partial<DraftEmail>) {
    persist(drafts.map((d) => (d.id === id ? { ...d, ...updates } : d)))
  }

  function removeDraft(id: string) {
    persist(drafts.filter((d) => d.id !== id))
  }

  async function sendToDrafts(draft: DraftEmail) {
    if (!session) { signIn('google'); return }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session as any).error === 'RefreshTokenError') {
      alert('Your Google session expired. Please sign out and sign in again.')
      signIn('google')
      return
    }

    try {
      const res = await fetch('/api/gmail/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: draft.to, subject: draft.subject, body: draft.body }),
      })

      if (res.ok) {
        updateDraft(draft.id, { status: 'sent-to-drafts' })
      } else {
        const data = await res.json().catch(() => ({}))
        const msg = data.error || `Server error (${res.status})`
        if (res.status === 401) {
          alert('Google session expired. Please sign in again.')
          signIn('google')
        } else {
          alert(`Failed to save to Gmail: ${msg}`)
        }
      }
    } catch {
      alert('Network error — check your connection and try again.')
    }
  }

  const filtered = drafts.filter((d) => filter === 'all' || d.status === filter)
  const pending = drafts.filter((d) => d.status === 'pending').length
  const sent = drafts.filter((d) => d.status === 'sent-to-drafts').length

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FileText size={18} style={{ color: 'var(--accent)' }} />
          Email Drafts
        </h1>
        <p style={{ color: 'var(--text-muted)' }}>
          Review AI-drafted emails, edit if needed, then send to Gmail Drafts for Monica to send.
        </p>
      </div>

      {/* Help */}
      <HelpBanner
        storageKey="drafts"
        title="How to use Email Drafts"
        steps={[
          { n: 1, text: 'Drafts are created automatically when you use Scan Inbox (follow-up emails) or Find Venues (inquiry emails).' },
          { n: 2, text: 'Read each draft carefully. Click the subject line or body to edit anything before sending.' },
          { n: 3, text: 'Click "Send to Gmail Drafts" — this saves the email in Monica\'s Gmail as a draft. Nothing is sent yet.' },
          { n: 4, text: 'Monica opens Gmail on her phone or computer, finds the draft, and sends it herself when she\'s ready.' },
        ]}
        tips={[
          { text: 'You must be signed in with Google for "Send to Gmail Drafts" to work.' },
          { text: 'Drafts stay here until you approve or delete them — they won\'t disappear on their own.' },
        ]}
      />

      {!session && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <p className="text-sm flex-1" style={{ color: 'var(--text-muted)' }}>
            Sign in to save drafts to Monica&apos;s Gmail.
          </p>
          <button
            onClick={() => signIn('google')}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
            style={{ background: 'var(--accent)', color: '#0c0a08' }}
          >
            <LogIn size={13} />
            Sign in
          </button>
        </div>
      )}

      {/* Stats + filter */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {(['all', 'pending', 'sent-to-drafts'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1 rounded-md text-sm capitalize transition-colors"
              style={{
                background: filter === f ? 'rgba(201,169,110,0.15)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {f === 'sent-to-drafts' ? 'Sent to Drafts' : f === 'all' ? `All (${drafts.length})` : `Pending (${pending})`}
            </button>
          ))}
        </div>

        {sent > 0 && (
          <span className="flex items-center gap-1 text-sm" style={{ color: '#4ade80' }}>
            <CheckCheck size={14} />
            {sent} saved to Gmail
          </span>
        )}
      </div>

      {/* Drafts list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          {drafts.length === 0
            ? 'No drafts yet. Go to "Find Venues" or "Scan Inbox" to generate emails.'
            : 'No drafts match this filter.'}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((draft) => (
            <DraftCard
              key={draft.id}
              draft={draft}
              onSendToDrafts={sendToDrafts}
              onUpdate={updateDraft}
              onRemove={removeDraft}
            />
          ))}
        </div>
      )}
    </div>
  )
}
