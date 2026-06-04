'use client'

import { MapPin, Users, DollarSign, Calendar, ChevronDown, ChevronUp, Mail, Phone, Waves, X } from 'lucide-react'
import { useState } from 'react'
import type { VenueRecord } from '@/types'

const STATUS_OPTIONS: VenueRecord['status'][] = [
  'new', 'contacted', 'interested', 'proposal received', 'toured', 'in negotiation', 'booked', 'declined',
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  new:               { bg: 'rgba(138,127,116,0.15)', text: '#8a7f74' },
  contacted:         { bg: 'rgba(201,169,110,0.15)', text: '#c9a96e' },
  interested:        { bg: 'rgba(74,222,128,0.12)',  text: '#4ade80' },
  'proposal received': { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  toured:            { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' },
  'in negotiation':  { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24' },
  booked:            { bg: 'rgba(74,222,128,0.18)',   text: '#22c55e' },
  declined:          { bg: 'rgba(248,113,113,0.12)', text: '#f87171' },
}

interface Props {
  venue: VenueRecord
  onStatusChange?: (id: string, status: VenueRecord['status']) => void
  onDraftEmail?: (venue: VenueRecord, type: 'follow-up' | 'decline') => void
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-2 text-sm">
      <div className="flex items-start gap-1.5 shrink-0 mt-0.5" style={{ color: 'var(--text-muted)', minWidth: 90 }}>
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <span style={{ color: '#e8e0d8' }}>{value}</span>
    </div>
  )
}

function BulletList({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm">
          <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: color, marginTop: 6 }} />
          <span style={{ color: 'var(--text-muted)' }}>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function VenueCard({ venue, onStatusChange, onDraftEmail }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [changingStatus, setChangingStatus] = useState(false)

  const scoreColor = venue.priorityScore >= 8 ? '#4ade80' : venue.priorityScore >= 5 ? '#c9a96e' : '#f87171'
  const statusStyle = STATUS_COLORS[venue.status] ?? STATUS_COLORS.new

  return (
    <div
      className="rounded-xl flex flex-col transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* ── Header ── */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-sm leading-snug">{venue.name}</h3>
            {venue.isOceanfront && (
              <span className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
                <Waves size={9} /> Oceanfront
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={11} />
            <span>{venue.location || '—'}</span>
            {venue.region && venue.region !== 'other' && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-xs"
                style={{ background: 'rgba(201,169,110,0.1)', color: 'var(--accent)' }}>
                {venue.region}
              </span>
            )}
          </div>
        </div>

        {/* Score + status */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-bold" style={{ color: scoreColor }}>{venue.priorityScore}</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>/10</span>
          </div>
          <button
            onClick={() => setChangingStatus(!changingStatus)}
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {venue.status || 'new'}
          </button>
        </div>
      </div>

      {/* Status picker dropdown */}
      {changingStatus && onStatusChange && (
        <div className="mx-4 mb-3 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { onStatusChange(venue.id, s); setChangingStatus(false) }}
              className="w-full text-left text-xs px-3 py-1.5 capitalize transition-colors hover:opacity-80"
              style={{
                background: venue.status === s ? statusStyle.bg : 'var(--card)',
                color: venue.status === s ? statusStyle.text : 'var(--text-muted)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Key facts as bullet rows ── */}
      <div className="px-4 pb-3 flex flex-col gap-2 border-t" style={{ borderColor: 'var(--border)', paddingTop: 12 }}>
        {venue.venueRentalFee && (
          <Row icon={<DollarSign size={12} />} label="Fee" value={venue.venueRentalFee} />
        )}
        {(venue.capacitySeated || venue.capacityReception) && (
          <Row
            icon={<Users size={12} />}
            label="Capacity"
            value={[
              venue.capacitySeated   ? `${venue.capacitySeated} seated`    : '',
              venue.capacityReception ? `${venue.capacityReception} reception` : '',
            ].filter(Boolean).join(' · ')}
          />
        )}
        {venue.availableDates && (
          <Row icon={<Calendar size={12} />} label="Available" value={venue.availableDates} />
        )}
        {venue.unavailableDates && (
          <Row icon={<X size={12} />} label="Unavailable" value={venue.unavailableDates} />
        )}
      </div>

      {/* ── Expandable details ── */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs mx-4 mb-3 self-start transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Less' : 'More details'}
      </button>

      {expanded && (
        <div className="px-4 pb-4 flex flex-col gap-4 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {/* Contact */}
          {(venue.contact.name || venue.contact.email || venue.contact.phone) && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Contact</span>
              {venue.contact.name && (
                <span className="text-sm" style={{ color: '#e8e0d8' }}>{venue.contact.name}{venue.contact.title ? ` — ${venue.contact.title}` : ''}</span>
              )}
              {venue.contact.email && (
                <a href={`mailto:${venue.contact.email}`} className="flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--accent)' }}>
                  <Mail size={11} />{venue.contact.email}
                </a>
              )}
              {venue.contact.phone && (
                <span className="flex items-center gap-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <Phone size={11} />{venue.contact.phone}
                </span>
              )}
            </div>
          )}

          {/* Pros */}
          {venue.pros && venue.pros.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#4ade80' }}>Pros</span>
              <BulletList items={venue.pros} color="#4ade80" />
            </div>
          )}

          {/* Cons */}
          {venue.cons && venue.cons.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#f87171' }}>Cons</span>
              <BulletList items={venue.cons} color="#f87171" />
            </div>
          )}

          {/* Notes */}
          {venue.notes && (
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Notes</span>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{venue.notes}</p>
            </div>
          )}

          {/* Source */}
          {venue.emailSubject && (
            <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.6 }}>
              From: &ldquo;{venue.emailSubject}&rdquo;{venue.emailDate ? ` · ${venue.emailDate}` : ''}
            </p>
          )}
        </div>
      )}

      {/* ── Actions ── */}
      {(onStatusChange || onDraftEmail) && (
        <div className="flex flex-wrap gap-2 px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {onDraftEmail && venue.status !== 'declined' && venue.status !== 'booked' && (
            <>
              <button
                onClick={() => onDraftEmail(venue, 'follow-up')}
                className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
                style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
              >
                Draft Follow-up
              </button>
              <button
                onClick={() => onDraftEmail(venue, 'decline')}
                className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
                style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                Draft Decline
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
