'use client'

import { useState } from 'react'
import { Send, Edit2, Check, X } from 'lucide-react'
import type { DraftEmail } from '@/types'

interface Props {
  draft: DraftEmail
  onSendToDrafts: (draft: DraftEmail) => Promise<void>
  onUpdate: (id: string, updates: Partial<DraftEmail>) => void
  onRemove: (id: string) => void
}

export default function DraftCard({ draft, onSendToDrafts, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(draft.body)
  const [subject, setSubject] = useState(draft.subject)
  const [sending, setSending] = useState(false)

  const typeColors: Record<string, string> = {
    inquiry: '#c9a96e',
    'follow-up': '#818cf8',
    'interest-confirmation': '#4ade80',
    decline: '#f87171',
  }

  async function handleSend() {
    setSending(true)
    await onSendToDrafts({ ...draft, subject, body })
    setSending(false)
  }

  function handleSaveEdit() {
    onUpdate(draft.id, { subject, body })
    setEditing(false)
  }

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2 py-0.5 rounded-full capitalize"
              style={{ background: `${typeColors[draft.type]}22`, color: typeColors[draft.type] }}
            >
              {draft.type}
            </span>
            <span className="font-medium truncate">{draft.venueName}</span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            To: {draft.to}
          </div>
        </div>

        {draft.status === 'sent-to-drafts' && (
          <span className="text-xs px-2 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>
            ✓ In Gmail Drafts
          </span>
        )}
      </div>

      {/* Subject + Body */}
      {editing ? (
        <div className="flex flex-col gap-2">
          <input
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: '#1a1714', border: '1px solid var(--border)', color: '#f0ebe4' }}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
          <textarea
            className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
            style={{ background: '#1a1714', border: '1px solid var(--border)', color: '#f0ebe4', minHeight: 160 }}
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: 'var(--accent)', color: '#0c0a08' }}
            >
              <Check size={12} />
              Save
            </button>
            <button
              onClick={() => { setBody(draft.body); setSubject(draft.subject); setEditing(false) }}
              className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          <div className="text-sm font-medium">{subject}</div>
          <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--text-muted)' }}>
            {body.length > 300 ? body.slice(0, 300) + '…' : body}
          </div>
        </div>
      )}

      {/* Actions */}
      {!editing && draft.status !== 'sent-to-drafts' && (
        <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#0c0a08' }}
          >
            <Send size={13} />
            {sending ? 'Saving…' : 'Send to Gmail Drafts'}
          </button>
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            <Edit2 size={13} />
            Edit
          </button>
          <button
            onClick={() => onRemove(draft.id)}
            className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg ml-auto"
            style={{ color: '#f87171' }}
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  )
}
