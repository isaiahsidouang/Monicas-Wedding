import type { KnownVenue, WeddingProfile } from '@/types'

export const weddingProfile: WeddingProfile = {
  bride: 'Monica',
  guestCount: 350,
  budgetMax: 115000,
  usDates: [
    'Any Saturday or Sunday in October 2026',
    'Any Saturday or Sunday in November 2026',
    'Any Saturday or Sunday in January 2026',
  ],
  caribbeanDates: [
    'Any Saturday or Sunday in November 2027',
    'Any Saturday or Sunday in January 2027',
    'Any Saturday or Sunday in February 2027',
  ],
  preferredBrands: ['Ritz-Carlton', 'St. Regis', 'Four Seasons', 'Rosewood', 'Aman'],
}

export const INQUIRY_SENDER = {
  name: 'Monica',
  email: '', // filled in from Gmail session
}

export const knownVenues: KnownVenue[] = [
  // ─── CALIFORNIA ───────────────────────────────────────────────────────────
  {
    id: 'rc-half-moon-bay',
    name: 'The Ritz-Carlton, Half Moon Bay',
    brand: 'Ritz-Carlton',
    location: 'Half Moon Bay, CA',
    region: 'california',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'weddingshmbrc@ritzcarlton.com',
    phone: '+1 (650) 712-7000',
    description:
      'Dramatic oceanfront bluffs overlooking the Pacific. 400+ guest capacity across multiple ballrooms and outdoor terraces.',
  },
  {
    id: 'rc-laguna-niguel',
    name: 'The Ritz-Carlton, Laguna Niguel',
    brand: 'Ritz-Carlton',
    location: 'Dana Point, CA',
    region: 'california',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'weddingslnrc@ritzcarlton.com',
    phone: '+1 (949) 240-2000',
    description:
      'Perched 150 feet above the Pacific. Stunning ocean views, indoor/outdoor ballrooms up to 500 guests.',
  },
  {
    id: 'stregis-monarch-beach',
    name: 'The St. Regis Monarch Beach',
    brand: 'St. Regis',
    location: 'Dana Point, CA',
    region: 'california',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'events.monarchbeach@stregis.com',
    phone: '+1 (949) 234-3200',
    description:
      'Private beach access, blufftop ceremony sites, and elegant ballrooms for up to 500 guests.',
  },
  {
    id: 'rc-rancho-mirage',
    name: 'The Ritz-Carlton, Rancho Mirage',
    brand: 'Ritz-Carlton',
    location: 'Rancho Mirage, CA',
    region: 'california',
    capacity: '400+',
    isOceanfront: false,
    contactEmail: 'weddingsrmrc@ritzcarlton.com',
    phone: '+1 (760) 321-8282',
    description:
      'Panoramic desert mountain views. Award-winning wedding venue with 11,000 sq ft of event space.',
  },
  {
    id: 'rc-san-francisco',
    name: 'The Ritz-Carlton, San Francisco',
    brand: 'Ritz-Carlton',
    location: 'San Francisco, CA',
    region: 'california',
    capacity: '350+',
    isOceanfront: false,
    contactEmail: 'weddingssf@ritzcarlton.com',
    phone: '+1 (415) 296-7465',
    description:
      'Historic Nob Hill landmark with grand ballrooms and exceptional city views. Up to 400 guests.',
  },

  // ─── CHICAGO ──────────────────────────────────────────────────────────────
  {
    id: 'rc-chicago',
    name: 'The Ritz-Carlton Chicago',
    brand: 'Ritz-Carlton',
    location: 'Chicago, IL',
    region: 'chicago',
    capacity: '400+',
    isOceanfront: false,
    contactEmail: 'weddingschicago@ritzcarlton.com',
    phone: '+1 (312) 266-1000',
    description:
      'Iconic Water Tower location. Grand Ballroom seats 400+. Stunning city views from 31 floors up.',
  },
  {
    id: 'stregis-chicago',
    name: 'The St. Regis Chicago',
    brand: 'St. Regis',
    location: 'Chicago, IL',
    region: 'chicago',
    capacity: '400+',
    isOceanfront: false,
    contactEmail: 'events.chicago@stregis.com',
    phone: '+1 (312) 646-1300',
    description:
      'New landmark tower with breathtaking Lake Michigan and skyline views. Up to 500 guests.',
  },

  // ─── MIAMI / SOUTH FLORIDA ────────────────────────────────────────────────
  {
    id: 'rc-south-beach',
    name: 'The Ritz-Carlton, South Beach',
    brand: 'Ritz-Carlton',
    location: 'Miami Beach, FL',
    region: 'miami',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'weddingssouthbeach@ritzcarlton.com',
    phone: '+1 (786) 276-4000',
    description:
      'Art Deco landmark directly on Miami Beach. Ocean terrace ceremonies, multiple event spaces up to 400 guests.',
  },
  {
    id: 'rc-bal-harbour',
    name: 'The Ritz-Carlton, Bal Harbour',
    brand: 'Ritz-Carlton',
    location: 'Bal Harbour, FL',
    region: 'miami',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'weddingsbalharbour@ritzcarlton.com',
    phone: '+1 (305) 455-5400',
    description:
      'Oceanfront luxury at the heart of Bal Harbour. Elegant ballroom and beachfront ceremony spaces.',
  },
  {
    id: 'stregis-bal-harbour',
    name: 'The St. Regis Bal Harbour Resort',
    brand: 'St. Regis',
    location: 'Bal Harbour, FL',
    region: 'miami',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'events.balharbour@stregis.com',
    phone: '+1 (305) 993-3300',
    description:
      'Twin oceanfront towers. Expansive ballrooms with direct beach access. Up to 450 guests.',
  },
  {
    id: 'rc-coconut-grove',
    name: 'The Ritz-Carlton, Coconut Grove',
    brand: 'Ritz-Carlton',
    location: 'Miami, FL',
    region: 'miami',
    capacity: '350+',
    isOceanfront: false,
    contactEmail: 'weddingscoconutgrove@ritzcarlton.com',
    phone: '+1 (305) 644-4680',
    description:
      'Elegant waterfront property in Coconut Grove. Stunning Biscayne Bay views, multiple ballrooms.',
  },
  {
    id: 'rc-fort-lauderdale',
    name: 'The Ritz-Carlton, Fort Lauderdale',
    brand: 'Ritz-Carlton',
    location: 'Fort Lauderdale, FL',
    region: 'miami',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'weddingsfortlauderdale@ritzcarlton.com',
    phone: '+1 (954) 465-2300',
    description:
      'Oceanfront resort directly on Fort Lauderdale Beach. Grand event spaces for 350+ guests.',
  },

  // ─── PUERTO RICO ──────────────────────────────────────────────────────────
  {
    id: 'rc-dorado-beach',
    name: 'Dorado Beach, A Ritz-Carlton Reserve',
    brand: 'Ritz-Carlton',
    location: 'Dorado, Puerto Rico',
    region: 'puerto-rico',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'weddings.doradobeach@ritzcarlton.com',
    phone: '+1 (787) 626-1100',
    description:
      'Ultra-exclusive Ritz-Carlton Reserve on the Atlantic coast. Pristine beach, lush grounds, and intimate luxury for 350 guests.',
  },
  {
    id: 'stregis-bahia-beach',
    name: 'The St. Regis Bahia Beach Resort',
    brand: 'St. Regis',
    location: 'Río Grande, Puerto Rico',
    region: 'puerto-rico',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'events.bahiabeach@stregis.com',
    phone: '+1 (787) 809-8000',
    description:
      'Nestled within a nature reserve on the Atlantic. Oceanfront ceremony sites, 400+ guest capacity.',
  },
  {
    id: 'rc-san-juan',
    name: 'The Ritz-Carlton, San Juan',
    brand: 'Ritz-Carlton',
    location: 'Isla Verde, Puerto Rico',
    region: 'puerto-rico',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'weddingssanjuan@ritzcarlton.com',
    phone: '+1 (787) 253-1700',
    description:
      'Caribbean beachfront resort with 400+ capacity. Multiple event spaces and ocean-view ceremony locations.',
  },

  // ─── CARIBBEAN ────────────────────────────────────────────────────────────
  {
    id: 'rc-grand-cayman',
    name: 'The Ritz-Carlton, Grand Cayman',
    brand: 'Ritz-Carlton',
    location: 'Seven Mile Beach, Grand Cayman',
    region: 'caribbean',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'weddingsgrandcayman@ritzcarlton.com',
    phone: '+1 (345) 943-9000',
    description:
      'Iconic Seven Mile Beach location. Outdoor ceremony spaces and grand ballrooms for 400+ guests on the Caribbean Sea.',
  },
  {
    id: 'rc-aruba',
    name: 'The Ritz-Carlton, Aruba',
    brand: 'Ritz-Carlton',
    location: 'Palm Beach, Aruba',
    region: 'caribbean',
    capacity: '400+',
    isOceanfront: true,
    contactEmail: 'weddingsaruba@ritzcarlton.com',
    phone: '+297 527 2222',
    description:
      'White sand Palm Beach location. Sunset terrace ceremonies and grand ballroom up to 400 guests. 365 days of sunshine.',
  },
  {
    id: 'stregis-bermuda',
    name: 'The St. Regis Bermuda Resort',
    brand: 'St. Regis',
    location: "St. George's Parish, Bermuda",
    region: 'caribbean',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'events.bermuda@stregis.com',
    phone: '+1 (441) 298-9000',
    description:
      'Oceanfront Bermuda landmark. Pink-sand surroundings, private beach access, and elegant ballrooms.',
  },
  {
    id: 'rc-turks-caicos',
    name: 'Grace Bay Club (5-Star)',
    brand: 'Luxury Independent',
    location: 'Grace Bay, Turks & Caicos',
    region: 'caribbean',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'weddings@gracebayclub.com',
    phone: '+1 (649) 946-5050',
    description:
      'World-renowned Grace Bay Beach. Private villas and elegant ballrooms for 350+ guests on one of the world\'s top beaches.',
  },
  {
    id: 'rosewood-bermuda',
    name: 'Rosewood Bermuda',
    brand: 'Rosewood',
    location: 'Tucker\'s Town, Bermuda',
    region: 'caribbean',
    capacity: '350+',
    isOceanfront: true,
    contactEmail: 'weddings.bermuda@rosewoodhotels.com',
    phone: '+1 (441) 298-4000',
    description:
      'Exclusive pink-sand paradise on a private peninsula. Intimate yet grand — up to 400 guests with spectacular ocean views.',
  },
]
