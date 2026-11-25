#!/usr/bin/env bash
# Reads data as an anonymous visitor (same RLS as the website) and checks the frontend mappers
# turn it into the shapes the pages expect.
set -euo pipefail
cd "$(dirname "$0")/../.."
Q() { psql -U postgres -d savora_test -Atq -c "begin; set local role anon; $1; rollback;" | grep -v '^$' ; }
J=$(mktemp)
cat > "$J" <<JSON
{
 "settings": $(Q "select to_json(s) from public.restaurant_settings s"),
 "hours": $(Q "select coalesce(json_agg(h),'[]') from public.opening_hours h"),
 "categories": $(Q "select json_agg(c order by sort_order) from public.menu_categories c"),
 "items": $(Q "select json_agg(i order by sort_order) from public.menu_items i where archived_at is null"),
 "areas": $(Q "select json_agg(a order by sort_order) from public.dining_areas a where active and bookable_online"),
 "sections": $(Q "select json_agg(c) from public.content_sections c where page = 'home'"),
 "testimonials": $(Q "select json_agg(t order by sort_order) from public.testimonials t")
}
JSON
node --input-type=module -e "
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import * as m from './src/services/mappers.js';
import * as sample from './src/data/sample.js';
import * as menuData from './src/data/menu.js';
const d = JSON.parse(readFileSync('$J', 'utf8'));
const url = (b, p) => 'https://cdn/' + b + '/' + p;
const r = m.mapRestaurant(d.settings, d.hours);
assert.equal(r.hours.days.length, 7);
assert.deepEqual(r.hours.days[0], { day: 'Monday', open: '12:00', close: '22:00' });
assert.equal(r.hours.sample, true, 'placeholder settings flagged');
assert.equal(r.address, null);
const menu = m.mapMenu(d.categories, d.items, url);
assert.equal(menu.categories.length, 13);
assert.equal(menu.categories.filter((c) => c.group === 'Drinks').length, 7);
assert.equal(menu.items.length, menuData.menuItems.length);
const jollof = menu.items.find((i) => i.name === 'Jollof Rice & Chicken');
assert.equal(jollof.price, 7000, 'kobo converted to naira');
assert.equal(jollof.category, 'local-specialties');
assert.equal(menu.items.find((i) => i.name === 'Pepper Soup').description, 'Goat');
// Database rows and the frontend fallback list must agree on every name and price.
assert.deepEqual(menu.items.map((i) => i.name + ' ' + i.price), menuData.menuItems.map((i) => i.name + ' ' + i.price));
const p = m.mapBookingPolicy(d.settings);
assert.equal(p.maxPartySize, 12); assert.equal(p.slotIntervalMinutes, 30);
assert.deepEqual(m.mapSeating(d.areas).map((s) => s.id), ['indoor', 'outdoor', 'private', 'none']);
const home = m.mapHomeContent(d.sections, d.testimonials, sample.homeContent);
assert.equal(home.heroTitleAccent, 'Flavour'); assert.equal(home.testimonials.length, 3);
console.log('  mappers produce the expected shapes from live database rows');
"
