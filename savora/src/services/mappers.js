/**
 * Pure functions that turn Supabase rows (snake_case, prices in kobo) into the shapes the UI
 * uses. Kept free of browser/Vite APIs so they can be tested with plain Node.
 */

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const hhmm = (t) => (t ? t.slice(0, 5) : null);

/** Opening-hours rows (ISO day_of_week 1-7, possibly several per day) → one entry per weekday. */
export function mapOpeningHours(rows, isPlaceholder) {
  const days = DAY_NAMES.map((day, i) => {
    const slots = rows
      .filter((r) => r.day_of_week === i + 1)
      .sort((a, b) => a.opens_at.localeCompare(b.opens_at));
    if (!slots.length) return { day, open: null, close: null };
    return { day, open: hhmm(slots[0].opens_at), close: hhmm(slots[slots.length - 1].closes_at) };
  });
  return { sample: Boolean(isPlaceholder), days };
}

export function mapRestaurant(s, hourRows) {
  return {
    name: s.name,
    descriptor: s.descriptor,
    address: s.address,
    phone: s.phone,
    email: s.email,
    whatsapp: s.whatsapp,
    mapsUrl: s.maps_url,
    social: (s.social_links || []).map((l) => ({ label: l.label, url: l.url || null })),
    currency: s.currency,
    timeZone: s.time_zone,
    hours: mapOpeningHours(hourRows, s.is_setup_placeholder),
  };
}

export function mapBookingPolicy(s) {
  return {
    sample: s.is_setup_placeholder,
    maxPartySize: s.max_party_size,
    minPartySize: s.min_party_size,
    minNoticeMinutes: s.min_notice_minutes,
    horizonDays: s.booking_horizon_days,
    slotIntervalMinutes: s.slot_interval_minutes,
    lastSeatingBeforeCloseMinutes: s.booking_duration_minutes,
    approvalMode: s.approval_mode,
  };
}

export function mapSeating(areas) {
  return [...areas.map((a) => ({ id: a.key, label: a.name })), { id: 'none', label: 'No preference' }];
}

export function mapMenu(categoryRows, itemRows, imageUrl) {
  const slugById = Object.fromEntries(categoryRows.map((c) => [c.id, c.slug]));
  return {
    categories: categoryRows.map((c) => ({ id: c.slug, name: c.name, group: c.menu_group })),
    items: itemRows
      .filter((i) => slugById[i.category_id])
      .map((i) => ({
        id: i.id,
        category: slugById[i.category_id],
        name: i.name,
        description: i.description || '',
        price: Math.round(Number(i.price_kobo) / 100),
        image: i.image_path ? imageUrl('menu', i.image_path) : null,
        available: i.available,
        featured: i.featured,
        tags: i.tags || [],
        allergens: i.allergens || '',
        sample: i.is_sample,
      })),
  };
}

export function mapHomeContent(sections, testimonialRows, fallback) {
  const hero = sections.find((s) => s.section === 'hero');
  const intro = sections.find((s) => s.section === 'intro');
  return {
    heroTitleLead: hero?.body.titleLead ?? fallback.heroTitleLead,
    heroTitleAccent: hero?.body.titleAccent ?? fallback.heroTitleAccent,
    heroTitleTail: hero?.body.titleTail ?? fallback.heroTitleTail,
    heroLede: hero?.body.lede ?? fallback.heroLede,
    introTitle: intro?.title ?? fallback.introTitle,
    intro: intro?.body.paragraphs ?? fallback.intro,
    testimonials: testimonialRows.map((t) => ({ id: t.id, quote: t.quote, author: t.author, sample: t.is_sample })),
  };
}

export function mapGallery(rows, imageUrl) {
  return rows.map((g) => ({
    id: g.id,
    category: g.category,
    alt: g.alt_text,
    src: imageUrl('gallery', g.storage_path),
    sample: false,
  }));
}
