import { analyzeEmails } from '@/lib/claude'

// Realistic mock emails that exercise all regions + various venue types/statuses.
// These mirror what Monica's real inbox looks like so the test is meaningful.
const MOCK_EMAILS = [
  {
    id: 'mock-1',
    threadId: 'thread-mock-1',
    subject: 'Re: Wedding Inquiry – The Ritz-Carlton, Chicago',
    from: 'weddings.chicago@ritzcarlton.com',
    date: 'Mon, 12 Jan 2026 09:14:00 -0600',
    body: `Dear Monica,

Thank you for your inquiry about hosting your wedding celebration at The Ritz-Carlton, Chicago.
We would be delighted to host your event for approximately 350 guests.

Our Grand Ballroom accommodates up to 450 guests for a seated dinner and 600 for a reception.
Venue rental fee: $18,000 for Saturday evenings.
F&B minimum: $95,000 for Saturdays.

We have availability on the following dates in 2026:
- Saturday, October 10, 2026 ✓
- Saturday, October 31, 2026 ✓
- Saturday, November 14, 2026 ✓
- Saturday, January 9, 2027 ✓

Please let me know if you'd like to schedule a site tour.

Warmly,
Sarah Mitchell
Director of Catering Sales
The Ritz-Carlton, Chicago
312-266-1000 ext. 5512`,
  },
  {
    id: 'mock-2',
    threadId: 'thread-mock-2',
    subject: 'Wedding Availability – St. Regis Bal Harbour',
    from: 'events.balharbour@stregis.com',
    date: 'Tue, 20 Jan 2026 11:30:00 -0500',
    body: `Hello Monica,

We received your inquiry for the St. Regis Bal Harbour Resort.

The St. Regis Bal Harbour features two oceanfront ballrooms:
- Atlantic Ballroom: seats up to 400 guests
- Bal Harbour Ballroom: seats up to 250 guests

For a 350-guest wedding:
Venue rental: $22,500
F&B minimum: $110,000 (Saturdays)
Package includes ceremony setup on the beach terrace, cocktail hour on the pool deck, and full reception.

Available 2026 dates: Oct 3, Oct 17, Nov 7, Nov 21
January 2027 has limited availability — please inquire.

Our rooms are oceanfront — guests can hear the waves during the ceremony.

Best,
Camille Torres
Senior Catering Manager
305-993-3300`,
  },
  {
    id: 'mock-3',
    threadId: 'thread-mock-3',
    subject: 'Dorado Beach Reserve – Wedding Package Information',
    from: 'weddings.doradobeach@ritzcarlton.com',
    date: 'Wed, 28 Jan 2026 14:00:00 -0400',
    body: `Dear Monica,

Dorado Beach, A Ritz-Carlton Reserve, is one of the most exclusive wedding venues in the Caribbean.

We accommodate up to 350 guests for a beach wedding ceremony and reception under the stars.
Our oceanfront setting on Puerto Rico's north coast is truly unmatched.

Pricing (exclusive resort buyout available):
- Venue fee: $35,000–$55,000 depending on package
- F&B minimum: $180,000
- Minimum room nights required: 100

Available dates for 2027: November 6–8 weekend, January 15–17, February 5–7

The Reserve is a 5-star property — no comparable venue exists in Puerto Rico.

I'd love to schedule a virtual tour at your convenience.

Warmly,
Isabella Reyes
Wedding Sales Manager
+1 (787) 626-1100`,
  },
  {
    id: 'mock-4',
    threadId: 'thread-mock-4',
    subject: 'RE: The Ritz-Carlton Laguna Niguel – Wedding Inquiry',
    from: 'weddingslnrc@ritzcarlton.com',
    date: 'Fri, 30 Jan 2026 10:00:00 -0800',
    body: `Hi Monica,

Thank you for your interest in The Ritz-Carlton, Laguna Niguel.

Perched 150 feet above the Pacific Ocean in Dana Point, California, our resort offers breathtaking
ocean views from both indoor and outdoor spaces.

Available spaces for 350 guests:
- Pacific Ballroom: seats 500, ocean view
- Terrace ceremony sites overlooking the Pacific
- Outdoor tent pavilion available spring-fall

Pricing:
Venue rental: $15,000
F&B minimum: $85,000 (Saturday)

2026 Saturday availability: October 3, October 17, November 14, November 21

Note: We are fully oceanfront — ceremony and cocktail hour can be set outdoors.

Warm regards,
Jessica Park
Director of Catering
949-240-2000`,
  },
  {
    id: 'mock-5',
    threadId: 'thread-mock-5',
    subject: 'Your Wedding at The Ritz-Carlton, Grand Cayman',
    from: 'weddingsgrandcayman@ritzcarlton.com',
    date: 'Mon, 2 Feb 2026 08:00:00 -0500',
    body: `Dear Monica,

Thank you for considering The Ritz-Carlton, Grand Cayman for your special day.

Located directly on Seven Mile Beach — consistently rated one of the world's best beaches —
we offer an incomparable Caribbean backdrop for your ceremony and reception.

Capacity: up to 400 guests for a seated dinner
Oceanfront ceremony locations: beach, poolside terrace, lawn
Venue rental: $20,000
F&B minimum: $95,000

Available 2027 dates (Caribbean season):
November 13–14, January 8–10, February 5–7

Our Cayman Ballroom is newly renovated (2025) with panoramic ocean views.

We'd love to arrange a complimentary site inspection for you.

Best,
Marcus Webb
Director of Events
+1 (345) 943-9000`,
  },
  {
    id: 'mock-6',
    threadId: 'thread-mock-6',
    subject: 'Wedding Inquiry Response – Four Seasons Chicago',
    from: 'events.chicago@fourseasons.com',
    date: 'Thu, 5 Feb 2026 15:00:00 -0600',
    body: `Dear Monica,

The Four Seasons Hotel Chicago would be honoured to host your wedding celebration.

We offer 6,500 sq ft of event space on our 30th floor with stunning Magnificent Mile views.
Maximum capacity: 350 guests seated, 500 reception.

Venue rental: $12,500
F&B minimum: $75,000 Saturday

Available 2026: October 10, October 24, November 7, November 21
January 2027 fully available.

What makes us unique: our dedicated wedding team, Michelin-starred in-house catering,
and the most iconic address in Chicago.

Looking forward to discussing further.

Elizabeth Owens
Catering Manager
312-280-8800`,
  },
  {
    id: 'mock-7',
    threadId: 'thread-mock-7',
    subject: 'Unsubscribe confirmation',
    from: 'noreply@weddingwire.com',
    date: 'Fri, 6 Feb 2026 09:00:00 -0500',
    body: `You have been successfully unsubscribed from WeddingWire promotional emails.`,
  },
]

export async function GET() {
  try {
    const venues = await analyzeEmails(MOCK_EMAILS)
    return Response.json({ venues, scanned: MOCK_EMAILS.length, testMode: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Test scan failed'
    return Response.json({ error: message }, { status: 500 })
  }
}
