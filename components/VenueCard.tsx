'use client'

import { MapPin, Users, DollarSign, Star, Waves, Calendar, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import type { VenueRecord } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  new: '#8a7f74',
  contacted: '#c9a96e',
  interested: '#4ade80',
  declined: '#f87171',
  booked: '#818cf8',
}

interface Props {
  venue: VenueRecord
  onStatusChange?: (id: string, status: VenueRecord['status']) => void
  onDraftEmail?: (venue: VenueRecord, type: 'follow-up' | 'decline') => void
}

export default function VenueCard({ venue, onStatusChange, onDraftEmail }: Props) {
  const [expanded, setExpanded] = useState(false)

  const scoreColor = venue.priorityScore >= 8 ? '#4ade80' : venue.priorityScore >= 5 ? '#c9a96e' : '#f87171'

  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-3 transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold truncate">{venue.name}</h3>
            {venue.isOceanfront && (
              <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(56,189,248,0.12)', color: '#38bdf8' }}>
                <Waves size={10} />
                Oceanfront
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>
            <MapPin size={12} />
            {venue.location}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Priority score */}
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: scoreColor }}>
              {venue.priorityScore}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>/ 10</div>
          </div>

          {/* Status badge */}
          <span
            className="text-xs px-2 py-0.5 rounded-full capitalize"
            style={{ background: `${STATUS_COLORS[venue.status]}22`, color: STATUS_COLORS[venue.status] }}
          >
            {venue.status}
          </span>
        </div>
      </div>

      {/* Key info row */}
      <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
        {venue.venueRentalFee && (
          <span className="flex items-center gap-1">
            <DollarSign size={12} />
            {venue.venueRentalFee}
          </span>
        )}
        {(venue.capacitySeated || venue.capacityReception) && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            {venue.capacitySeated || venue.capacityReception}
          </span>
        )}
        {venue.availableDates && (
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {venue.availableDates}
          </span>
        )}
        {venue.tier && (
          <span className="flex items-center gap-1">
            <Star size={12} />
            {venue.tier}
          </span>
        )}
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs self-start transition-colors"
        style={{ color: 'var(--text-muted)' }}
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Less' : 'More details'}
      </button>

      {expanded && (
        <div className="flex flex-col gap-2 text-sm border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {venue.contact.email && (
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Contact: </span>
              <a href={`mailto:${venue.contact.email}`} className="hover:underline" style={{ color: 'var(--accent)' }}>
                {venue.contact.name ? `${venue.contact.name} — ` : ''}{venue.contact.email}
              </a>
              {venue.contact.phone && (
                <span style={{ color: 'var(--text-muted)' }}> · {venue.contact.phone}</span>
              )}
            </div>
          )}

          {venue.pros && venue.pros.length > 0 && (
            <div>
              <span className="text-xs font-medium" style={{ color: '#4ade80' }}>Pros</span>
              <ul className="mt-1 space-y-0.5">
                {venue.pros.map((p, i) => (
                  <li key={i} style={{ color: 'var(--text-muted)' }}>✓ {p}</li>
                ))}
              </ul>
            </div>
          )}

          {venue.cons && venue.cons.length > 0 && (
            <div>
              <span className="text-xs font-medium" style={{ color: '#f87171' }}>Cons</span>
              <ul className="mt-1 space-y-0.5">
                {venue.cons.map((c, i) => (
                  <li key={i} style={{ color: 'var(--text-muted)' }}>✗ {c}</li>
                ))}
              </ul>
            </div>
          )}

          {venue.notes && (
            <p style={{ color: 'var(--text-muted)' }}>{venue.notes}</p>
          )}

          {venue.emailSubject && (
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              From email: &ldquo;{venue.emailSubject}&rdquo; · {venue.emailDate}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {(onStatusChange || onDraftEmail) && (
        <div className="flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
          {onStatusChange && venue.status === 'new' && (
            <button
              onClick={() => onStatusChange(venue.id, 'contacted')}
              className="text-xs px-3 py-1 rounded-lg transition-colors"
              style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            >
              Mark Contacted
            </button>
          )}
          {onDraftEmail && venue.status !== 'declined' && venue.status !== 'booked' && (
            <>
              <button
                onClick={() => onDraftEmail(venue, 'follow-up')}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
                style={{ border: '1px solid var(--accent)', color: 'var(--accent)' }}
              >
                Draft Follow-up
              </button>
              <button
                onClick={() => onDraftEmail(venue, 'decline')}
                className="text-xs px-3 py-1 rounded-lg transition-colors"
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
