/**
 * SAMPLE / SETUP DATA — NOT REAL BUSINESS INFORMATION.
 *
 * The brief forbids inventing SAVORA's address, phone, hours, menu, prices,
 * chefs or history. Everything here is either a clearly marked placeholder
 * ("[To be supplied]") or demo content flagged `sample: true`, and is shown
 * on the site with a visible "Sample" label.
 *
 * In Phase 2 this file is replaced as the data source by Supabase tables
 * (restaurant_settings, opening_hours, menu_categories, menu_items,
 * content_sections, testimonials, gallery_images, chef_profiles).
 * It stays only as the seed source for `supabase/seed/demo.sql`.
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

export const menuCategories = [
  { id: 'starters', name: 'Starters' },
  { id: 'african-classics', name: 'African Classics' },
  { id: 'continental', name: 'Continental Favourites' },
  { id: 'mains', name: 'Main Courses' },
  { id: 'seafood', name: 'Seafood' },
  { id: 'sides', name: 'Sides' },
  { id: 'desserts', name: 'Desserts' },
  { id: 'drinks', name: 'Drinks' },
];

/** Demo dishes only. Names are generic examples; prices are illustrative. */
export const menuItems = [
  { id: 's1', category: 'starters', name: 'Peppered Gizzard Skewers', description: 'Grilled gizzard, sweet peppers, scotch bonnet glaze.', price: 6500, featured: true, available: true, tags: ['Spicy'], allergens: '' },
  { id: 's2', category: 'starters', name: 'Plantain & Avocado Bruschetta', description: 'Toasted sourdough, ripe plantain, avocado, lime.', price: 5500, featured: false, available: true, tags: ['Vegetarian'], allergens: 'Gluten' },
  { id: 's3', category: 'starters', name: 'Pepper Soup Shots', description: 'Light, aromatic broth with uziza and scent leaf.', price: 4500, featured: false, available: false, tags: ['Spicy'], allergens: '' },
  { id: 'a1', category: 'african-classics', name: 'Smoky Party Jollof', description: 'Firewood-style jollof rice, grilled chicken, fried plantain, salad.', price: 14500, featured: true, available: true, tags: ['Signature'], allergens: '' },
  { id: 'a2', category: 'african-classics', name: 'Egusi & Pounded Yam', description: 'Melon seed soup with assorted meats and leafy greens.', price: 15500, featured: false, available: true, tags: [], allergens: '' },
  { id: 'a3', category: 'african-classics', name: 'Suya-Spiced Beef Platter', description: 'Thin-sliced beef, yaji spice, onions, tomato, cabbage.', price: 13000, featured: true, available: true, tags: ['Spicy', 'Signature'], allergens: 'Peanut' },
  { id: 'c1', category: 'continental', name: 'Creamy Tuscan Chicken Pasta', description: 'Penne, sun-dried tomato cream, spinach, parmesan.', price: 12500, featured: false, available: true, tags: [], allergens: 'Gluten, Dairy' },
  { id: 'c2', category: 'continental', name: 'Classic Caesar Salad', description: 'Cos lettuce, croutons, parmesan, house dressing.', price: 9000, featured: false, available: true, tags: [], allergens: 'Gluten, Dairy, Egg, Fish' },
  { id: 'm1', category: 'mains', name: 'Grilled Ribeye', description: 'Chargrilled steak, pepper sauce, hand-cut chips.', price: 28000, featured: true, available: true, tags: ['Signature'], allergens: 'Dairy' },
  { id: 'm2', category: 'mains', name: 'Ofada Rice & Ayamase', description: 'Local ofada rice with green pepper stew and boiled egg.', price: 13500, featured: false, available: true, tags: ['Spicy'], allergens: 'Egg' },
  { id: 'f1', category: 'seafood', name: 'Whole Grilled Croaker', description: 'Spiced whole fish, peppered sauce, roasted potatoes.', price: 22000, featured: true, available: true, tags: [], allergens: 'Fish' },
  { id: 'f2', category: 'seafood', name: 'Garlic Butter Prawns', description: 'King prawns, garlic butter, chilli, herbs.', price: 19500, featured: false, available: true, tags: [], allergens: 'Shellfish, Dairy' },
  { id: 'd1', category: 'sides', name: 'Fried Plantain (Dodo)', description: 'Sweet ripe plantain, fried golden.', price: 3000, featured: false, available: true, tags: ['Vegan'], allergens: '' },
  { id: 'd2', category: 'sides', name: 'Moi Moi', description: 'Steamed bean pudding.', price: 3500, featured: false, available: true, tags: ['Vegetarian'], allergens: 'Egg' },
  { id: 'e1', category: 'desserts', name: 'Puff-Puff with Salted Caramel', description: 'Warm dough bites, caramel, vanilla cream.', price: 5000, featured: false, available: true, tags: ['Vegetarian'], allergens: 'Gluten, Dairy' },
  { id: 'e2', category: 'desserts', name: 'Chocolate Fondant', description: 'Molten centre, vanilla ice cream.', price: 6500, featured: false, available: true, tags: ['Vegetarian'], allergens: 'Gluten, Dairy, Egg' },
  { id: 'k1', category: 'drinks', name: 'Chapman', description: 'Classic Nigerian fruit punch with cucumber and citrus.', price: 4000, featured: false, available: true, tags: ['Non-alcoholic'], allergens: '' },
  { id: 'k2', category: 'drinks', name: 'Zobo Spritz', description: 'Hibiscus, ginger, sparkling water.', price: 3500, featured: false, available: true, tags: ['Non-alcoholic'], allergens: '' },
  { id: 'k3', category: 'drinks', name: 'Fresh Pineapple-Ginger Juice', description: 'Pressed to order.', price: 3500, featured: false, available: true, tags: ['Non-alcoholic'], allergens: '' },
].map((item) => ({ ...item, sample: true }));

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
