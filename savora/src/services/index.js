/**
 * Service layer. Every page reads and writes through these functions, never through local
 * arrays or Supabase directly.
 *
 *  - With Supabase configured (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY), reads come from the
 *    database. Row Level Security limits the browser to published, public data.
 *  - Without it, reads return the labelled sample data in src/data/sample.js (`isSample: true`)
 *    so the site can be designed and reviewed before the backend exists.
 *  - Writes (reservations, enquiries, contact, newsletter) never pretend to succeed. They go to
 *    server-side Edge Functions, which validate, rate-limit and save with the service role. With
 *    no backend they throw BackendNotConfiguredError and the UI says nothing was saved.
 */
import { isBackendConfigured, supabase } from '../lib/supabase';
import * as sample from '../data/sample';
import * as menu from '../data/menu';
import {
  mapBookingPolicy, mapGallery, mapHomeContent, mapMenu, mapOpeningHours, mapRestaurant, mapSeating,
} from './mappers';

export class BackendNotConfiguredError extends Error {
  constructor(feature) {
    super(`${feature} is not connected yet.`);
    this.name = 'BackendNotConfiguredError';
    this.feature = feature;
  }
}

/** Unwrap a Supabase response, turning errors into exceptions the UI's error state can show. */
async function rows(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

const imageUrl = (bucket, path) => supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;

// Settings and hours are used by several pages; fetch them once per page load.
let settingsPromise;
function loadSettings() {
  settingsPromise ??= Promise.all([
    rows(supabase.from('restaurant_settings').select('*').single()),
    rows(supabase.from('opening_hours').select('day_of_week, opens_at, closes_at')),
  ]).catch((err) => { settingsPromise = undefined; throw err; });
  return settingsPromise;
}

/* ---------- Reads ---------- */

export async function getRestaurantProfile() {
  if (!isBackendConfigured) {
    return { data: { ...sample.restaurant, hours: sample.openingHours }, isSample: true };
  }
  const [settings, hours] = await loadSettings();
  return { data: mapRestaurant(settings, hours), isSample: settings.is_setup_placeholder };
}

export async function getHomeContent() {
  if (!isBackendConfigured) {
    return { data: { ...sample.homeContent, testimonials: sample.testimonials }, isSample: true };
  }
  const [sections, testimonials] = await Promise.all([
    rows(supabase.from('content_sections').select('section, title, body, is_sample').eq('page', 'home')),
    rows(supabase.from('testimonials').select('id, quote, author, is_sample').order('sort_order')),
  ]);
  return {
    data: mapHomeContent(sections, testimonials, sample.homeContent),
    isSample: sections.some((s) => s.is_sample) || testimonials.some((t) => t.is_sample),
  };
}

export async function getMenu() {
  if (!isBackendConfigured) {
    return { data: { categories: menu.menuCategories, items: menu.menuItems }, isSample: false };
  }
  const [categories, items] = await Promise.all([
    rows(supabase.from('menu_categories').select('id, slug, name, menu_group, is_sample').order('sort_order')),
    rows(supabase.from('menu_items')
      .select('id, category_id, name, description, price_kobo, image_path, available, featured, tags, allergens, is_sample')
      .is('archived_at', null)
      .order('sort_order')),
  ]);
  return { data: mapMenu(categories, items, imageUrl), isSample: items.some((i) => i.is_sample) };
}

export async function getFeaturedDishes(limit = 4) {
  const { data, isSample } = await getMenu();
  return { data: data.items.filter((i) => i.featured && i.available).slice(0, limit), isSample };
}

export async function getGallery() {
  if (!isBackendConfigured) {
    return { data: { categories: sample.galleryCategories, images: sample.galleryImages }, isSample: true };
  }
  const images = await rows(
    supabase.from('gallery_images').select('id, storage_path, alt_text, category').order('sort_order'),
  );
  // Until real photos are uploaded, keep showing the labelled placeholder frames.
  if (!images.length) return { data: { categories: sample.galleryCategories, images: sample.galleryImages }, isSample: true };
  return { data: { categories: sample.galleryCategories, images: mapGallery(images, imageUrl) }, isSample: false };
}

export async function getBookingConfig() {
  if (!isBackendConfigured) {
    return {
      data: { policy: sample.bookingPolicy, seating: sample.seatingOptions, occasions: sample.occasions, hours: sample.openingHours },
      isSample: true,
    };
  }
  const [[settings, hours], areas] = await Promise.all([
    loadSettings(),
    rows(supabase.from('dining_areas').select('key, name').eq('active', true).eq('bookable_online', true).order('sort_order')),
  ]);
  return {
    data: {
      policy: mapBookingPolicy(settings),
      seating: mapSeating(areas),
      occasions: sample.occasions,
      hours: mapOpeningHours(hours, settings.is_setup_placeholder),
    },
    isSample: settings.is_setup_placeholder,
  };
}

export const getEventTypes = async () => ({ data: sample.eventTypes, isSample: false });

/* ---------- Writes (server-side only) ---------- */

async function invoke(fnName, feature, payload) {
  if (!isBackendConfigured) throw new BackendNotConfiguredError(feature);
  const { data, error } = await supabase.functions.invoke(fnName, { body: payload });
  if (error) {
    // A missing function (not yet deployed) is reported as "not connected", never as success.
    if (error.name === 'FunctionsHttpError' && error.context?.status === 404) throw new BackendNotConfiguredError(feature);
    throw new Error(`${feature} failed. Please try again.`);
  }
  return data;
}

/** Resolves to { reference, status: 'pending' | 'confirmed' } only after the server saved it. Edge Function: Phase 4. */
export const createReservation = (payload) => invoke('create-reservation', 'Online booking', payload);
/** Edge Functions for these three are delivered with the integrations in Phase 6. */
export const submitEventEnquiry = (payload) => invoke('submit-event-enquiry', 'Event enquiries', payload);
export const submitContactMessage = (payload) => invoke('submit-contact-message', 'The contact form', payload);
export const subscribeNewsletter = (payload) => invoke('subscribe-newsletter', 'Newsletter sign-up', payload);
