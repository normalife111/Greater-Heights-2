/**
 * Service layer. Every page reads and writes through these functions, never
 * through local arrays or Supabase directly, so Phase 2 only swaps the
 * implementation here.
 *
 * Phase 1 status:
 *  - Reads return clearly labelled sample/setup data (`isSample: true`).
 *  - Writes (reservations, enquiries, contact, newsletter) do NOT pretend to
 *    succeed. Without a configured backend they throw BackendNotConfiguredError,
 *    and the UI tells the guest to contact the restaurant directly.
 */
import { isBackendConfigured, supabase } from '../lib/supabase';
import * as sample from '../data/sample';

export class BackendNotConfiguredError extends Error {
  constructor(feature) {
    super(`${feature} is not connected yet.`);
    this.name = 'BackendNotConfiguredError';
    this.feature = feature;
  }
}

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

/* ---------- Reads ---------- */

export async function getRestaurantProfile() {
  await delay();
  return { data: { ...sample.restaurant, hours: sample.openingHours }, isSample: true };
}

export async function getHomeContent() {
  await delay();
  return { data: { ...sample.homeContent, testimonials: sample.testimonials }, isSample: true };
}

export async function getMenu() {
  await delay();
  return { data: { categories: sample.menuCategories, items: sample.menuItems }, isSample: true };
}

export async function getFeaturedDishes(limit = 4) {
  const { data, isSample } = await getMenu();
  return { data: data.items.filter((i) => i.featured && i.available).slice(0, limit), isSample };
}

export async function getGallery() {
  await delay();
  return { data: { categories: sample.galleryCategories, images: sample.galleryImages }, isSample: true };
}

export async function getBookingConfig() {
  await delay();
  return {
    data: {
      policy: sample.bookingPolicy,
      seating: sample.seatingOptions,
      occasions: sample.occasions,
      hours: sample.openingHours,
    },
    isSample: true,
  };
}

export const getEventTypes = async () => ({ data: sample.eventTypes, isSample: false });

/* ---------- Writes ---------- */

async function invoke(fnName, feature, payload) {
  if (!isBackendConfigured) throw new BackendNotConfiguredError(feature);
  // Phase 2+/4: server-side Edge Functions validate, rate-limit and save.
  const { data, error } = await supabase.functions.invoke(fnName, { body: payload });
  if (error) throw new Error(error.message || `${feature} failed. Please try again.`);
  return data;
}

/** Returns { reference, status: 'pending' | 'confirmed' } only after the server saved it. */
export const createReservation = (payload) => invoke('create-reservation', 'Online booking', payload);
export const submitEventEnquiry = (payload) => invoke('submit-event-enquiry', 'Event enquiries', payload);
export const submitContactMessage = (payload) => invoke('submit-contact-message', 'The contact form', payload);
export const subscribeNewsletter = (payload) => invoke('subscribe-newsletter', 'Newsletter sign-up', payload);
