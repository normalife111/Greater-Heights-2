/**
 * SAMPLE / SETUP DATA — NOT REAL BUSINESS INFORMATION.
 *
 * The brief forbids inventing SAVORA's address, phone, hours, menu, prices,
 * chefs or history. Everything here is either a clearly marked placeholder
 * ("[To be supplied]") or demo content flagged `sample: true`, and is shown
 * on the site with a visible "Sample" label.
 *
 * With Supabase connected, the site reads these from the database instead
 * (restaurant_settings, opening_hours, content_sections, testimonials, ...).
 * This file is also the source for `supabase/seed/demo.sql`.
 */

export const PLACEHOLDER = '[To be supplied by owner]';

export const restaurant = {
  name: 'SAVORA',
  descriptor: 'Afro-Continental Bistro',
  address: null,          // e.g. "12 Example Street, Lagos" — owner to supply
  phone: null,
  email: null,
  whatsapp: null,
  mapsUrl: null,
  social: [
    { label: 'Instagram', url: null },
    { label: 'Facebook', url: null },
    { label: 'TikTok', url: null },
    { label: 'X', url: null },
  ],
  currency: 'NGN',
  timeZone: 'Africa/Lagos',
};

/** Hours are placeholders until verified. `sample: true` keeps the label visible. */
export const openingHours = {
  sample: true,
  days: [
    { day: 'Monday', open: '12:00', close: '22:00' },
    { day: 'Tuesday', open: '12:00', close: '22:00' },
    { day: 'Wednesday', open: '12:00', close: '22:00' },
    { day: 'Thursday', open: '12:00', close: '23:00' },
    { day: 'Friday', open: '12:00', close: '23:30' },
    { day: 'Saturday', open: '11:00', close: '23:30' },
    { day: 'Sunday', open: '11:00', close: '21:00' },
  ],
};

export const homeContent = {
  heroTitleLead: 'Where Every',
  heroTitleAccent: 'Flavour',
  heroTitleTail: 'Tells a Story.',
  heroLede:
    'Experience the rich taste of African and continental cuisine in a warm, stylish and welcoming atmosphere.',
  introTitle: 'Our Story',
  intro: [
    'SAVORA brings together the bold flavours of African kitchens and the techniques of continental cooking, served in a room built for long, unhurried meals.',
    'The full story, our team and our philosophy will be published here once the restaurant has approved them.',
  ],
};

// The menu is real owner-supplied data and lives in ./menu.js.

export const testimonials = [
  { id: 't1', quote: 'Guest reviews will appear here once the restaurant approves them.', author: 'Sample testimonial', sample: true },
  { id: 't2', quote: 'Use real, consented quotes from guests or review platforms.', author: 'Sample testimonial', sample: true },
  { id: 't3', quote: 'Testimonials are managed from the admin dashboard in Phase 5.', author: 'Sample testimonial', sample: true },
];

export const galleryCategories = ['All', 'Food', 'Interior', 'Drinks', 'Events'];
export const galleryImages = [
  { id: 'g1', category: 'Food', alt: 'Signature jollof plate' },
  { id: 'g2', category: 'Interior', alt: 'Dining room with warm pendant lighting' },
  { id: 'g3', category: 'Drinks', alt: 'Chapman cocktail on the bar' },
  { id: 'g4', category: 'Food', alt: 'Grilled fish with peppered sauce' },
  { id: 'g5', category: 'Events', alt: 'Private dining table set for a celebration' },
  { id: 'g6', category: 'Interior', alt: 'Bar counter at night' },
  { id: 'g7', category: 'Food', alt: 'Suya-spiced beef platter' },
  { id: 'g8', category: 'Drinks', alt: 'Zobo spritz with hibiscus garnish' },
].map((img) => ({ ...img, src: null, sample: true }));

export const eventTypes = [
  { id: 'birthday', title: 'Birthdays', text: 'Mark the day with a table that feels like a celebration.' },
  { id: 'anniversary', title: 'Anniversaries', text: 'A quiet corner, a considered menu and good wine.' },
  { id: 'corporate', title: 'Corporate Dining', text: 'Team dinners, client lunches and launch evenings.' },
  { id: 'private', title: 'Private Dining', text: 'Exclusive use of a dedicated space for your guests.' },
];

export const seatingOptions = [
  // Only options the restaurant configures will show. Placeholder set:
  { id: 'indoor', label: 'Indoor' },
  { id: 'outdoor', label: 'Outdoor' },
  { id: 'private', label: 'Private dining' },
  { id: 'none', label: 'No preference' },
];

export const occasions = ['None', 'Birthday', 'Anniversary', 'Business', 'Date night', 'Celebration', 'Other'];

export const bookingPolicy = {
  sample: true,
  maxPartySize: 12,
  minNoticeMinutes: 120,
  horizonDays: 60,
  slotIntervalMinutes: 30,
  lastSeatingBeforeCloseMinutes: 90,
};
