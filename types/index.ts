export interface VenueRecord {
  id: string
  name: string
  type: 'venue' | 'vendor' | 'unknown'
  region?: 'illinois' | 'california' | 'puerto-rico' | 'caribbean' | 'miami' | 'other'
  contact: {
    name?: string
    title?: string
    email: string
    phone?: string
    website?: string
  }
  location: string
  // Capacity
  capacitySeated?: string
  capacityReception?: string
  // Financials
  venueRentalFee?: string
  fbMinimum?: string
  // Availability
  availableDates?: string
  unavailableDates?: string
  // Status & tracking
  status: string // open-ended to match her existing statuses
  priority: 'High' | 'Medium' | 'Low' | ''
  tourScheduled?: string
  followedUp?: string
  lastResponseDate?: string
  nextAction?: string
  nextActionDueDate?: string
  // Notes & analysis
  notes?: string
  amenities?: string[]
  pros?: string[]
  cons?: string[]
  isOceanfront?: boolean
  tier?: string
  // Source tracking
  priorityScore: number // 1–10 from Claude analysis
  emailSubject?: string
  emailDate?: string
  gmailThreadId?: string
  analyzedAt: string
  importedFromExcel?: boolean
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
