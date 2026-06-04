export interface VenueRecord {
  id: string
  name: string
  type: 'venue' | 'vendor' | 'unknown'
  contact: {
    name?: string
    email: string
    phone?: string
  }
  location: string
  pricing?: string
  capacity?: string
  availability?: string
  amenities?: string[]
  pros?: string[]
  cons?: string[]
  notes?: string
  priorityScore: number // 1–10 from Claude analysis
  status: 'new' | 'contacted' | 'interested' | 'declined' | 'booked'
  emailSubject?: string
  emailDate?: string
  gmailThreadId?: string
  isOceanfront?: boolean
  tier?: string
  analyzedAt: string
}

export interface DraftEmail {
  id: string
  venueId?: string
  venueName: string
  to: string
  subject: string
  body: string
  type: 'inquiry' | 'follow-up' | 'interest-confirmation' | 'decline'
  status: 'pending' | 'sent-to-drafts' | 'approved'
  createdAt: string
}

export interface KnownVenue {
  id: string
  name: string
  brand: string
  location: string
  region: 'california' | 'chicago' | 'miami' | 'puerto-rico' | 'caribbean'
  capacity: string
  isOceanfront: boolean
  contactEmail?: string
  phone?: string
  description: string
}

export interface WeddingProfile {
  bride: string
  guestCount: number
  budgetMax: number
  usDates: string[]
  caribbeanDates: string[]
  preferredBrands: string[]
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
}
