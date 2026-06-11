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
  lastResponseFrom?: 'vendor' | 'user'
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
  region: 'california' | 'chicago' | 'miami' | 'puerto-rico' | 'caribbean' |
          'hawaii' | 'new-york' | 'florida-keys' | 'new-england' |
          'las-vegas' | 'nashville' | 'new-orleans' | 'scottsdale' | 'usvi' | 'other'
  capacity: string
  isOceanfront: boolean
  contactEmail?: string
  phone?: string
  description: string
  discovered?: boolean
}

export interface WeddingProfile {
  bride: string
  guestCount: number
  budgetMax: number
  usDates: string[]
  caribbeanDates: string[]
  preferredBrands: string[]
}

// ─── CHECKLIST ────────────────────────────────────────────────────────────────
export interface ChecklistItem {
  id: string
  category: string
  task: string
  timeframe: string // e.g. "12 months before"
  dueDate?: string  // ISO date string
  completed: boolean
  notes?: string
  priority: 'high' | 'medium' | 'low'
}

// ─── BUDGET ───────────────────────────────────────────────────────────────────
export interface BudgetItem {
  id: string
  category: string
  description: string
  estimated: number
  actual: number
  paid: number
  vendor?: string
  notes?: string
  dueDate?: string
}

// ─── VENDOR ───────────────────────────────────────────────────────────────────
export type VendorCategory =
  | 'Photographer'
  | 'Videographer'
  | 'Florist'
  | 'Band / DJ'
  | 'Hair & Makeup'
  | 'Officiant'
  | 'Catering'
  | 'Cake / Desserts'
  | 'Transportation'
  | 'Invitations'
  | 'Rentals'
  | 'Other'

export interface VendorRecord {
  id: string
  category: VendorCategory
  name: string
  contact: {
    name?: string
    email?: string
    phone?: string
    website?: string
  }
  status: 'researching' | 'contacted' | 'proposal-received' | 'booked' | 'declined'
  price?: number
  notes?: string
  priority: 'High' | 'Medium' | 'Low' | ''
  createdAt: string
}

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export interface ContractRecord {
  id: string
  vendorName: string
  category: string
  totalAmount: number
  depositAmount: number
  depositPaid: boolean
  depositPaidDate?: string
  depositDueDate?: string
  remainingBalance: number
  balanceDueDate?: string
  contractSigned: boolean
  contractSignedDate?: string
  notes?: string
  createdAt: string
}

// ─── DAY-OF TIMELINE ──────────────────────────────────────────────────────────
export interface TimelineItem {
  id: string
  time: string // "HH:MM" 24hr
  label: string
  location?: string
  responsible?: string
  notes?: string
  category: 'prep' | 'ceremony' | 'photos' | 'reception' | 'other'
}

declare module 'next-auth' {
  interface Session {
    accessToken?: string
  }
}
