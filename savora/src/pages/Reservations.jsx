import { useMemo, useState } from 'react';
import ContactLines from '../components/ContactLines';
import OpeningHours from '../components/OpeningHours';
import { Field, Notice, Placeholder } from '../components/ui';
import { formatTime, fromMinutes, isoDate, isValidEmail, isValidPhone, toMinutes } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { BackendNotConfiguredError, createReservation, getBookingConfig, getRestaurantProfile } from '../services';

const EMPTY = { name: '', email: '', phone: '', partySize: '2', date: '', time: '', seating: 'none', occasion: 'None', dietary: '', request: '', company: '' };

/**
 * Times listed here are only a guide built from opening hours. The server is
 * the authority: it recalculates availability and capacity atomically when
 * the booking is created (Phase 4).
 */
function indicativeSlots(dateStr, config) {
  if (!dateStr || !config) return [];
  const date = new Date(`${dateStr}T00:00`);
  const dayName = date.toLocaleDateString('en-GB', { weekday: 'long' });
  const day = config.hours.days.find((d) => d.day === dayName);
  if (!day?.open) return [];
  const { slotIntervalMinutes: step, lastSeatingBeforeCloseMinutes: last, minNoticeMinutes } = config.policy;
  const now = new Date();
  const earliest = dateStr === isoDate(now) ? now.getHours() * 60 + now.getMinutes() + minNoticeMinutes : 0;
  const slots = [];
  for (let m = toMinutes(day.open); m <= toMinutes(day.close) - last; m += step) {
    if (m >= earliest) slots.push(fromMinutes(m));
  }
  return slots;
}

function validate(f, config) {
  const e = {};
  if (f.name.trim().length < 2) e.name = 'Enter your full name.';
  if (!isValidEmail(f.email)) e.email = 'Enter a valid email address.';
  if (!isValidPhone(f.phone)) e.phone = 'Enter a valid phone number, e.g. +234 800 000 0000.';
  const size = Number(f.partySize);
  if (!size || size < 1) e.partySize = 'Choose how many guests.';
  if (!f.date) e.date = 'Choose a date.';
  if (!f.time) e.time = 'Choose a time.';
  if (f.request.length > 500) e.request = 'Keep special requests under 500 characters.';
  if (config && size > config.policy.maxPartySize) e.partySize = `For more than ${config.policy.maxPartySize} guests, send an event enquiry instead.`;
  return e;
}

export default function Reservations() {
  const cfg = useAsync(getBookingConfig);
  const profile = useAsync(getRestaurantProfile);
  const config = cfg.data;
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' });

  const today = new Date();
  const minDate = isoDate(today);
  const maxDate = config ? isoDate(new Date(today.getTime() + config.policy.horizonDays * 864e5)) : undefined;
  const slots = useMemo(() => indicativeSlots(form.date, config), [form.date, config]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === 'date' ? { time: '' } : {}) }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  async function onSubmit(e) {
    e.preventDefault();
    const found = validate(form, config);
    setErrors(found);
    if (Object.keys(found).length) {
      setStatus({ state: 'invalid' });
      document.getElementById(`res-${Object.keys(found)[0]}`)?.focus();
      return;
    }
    setStatus({ state: 'loading' });
    try {
      const result = await createReservation({ ...form, partySize: Number(form.partySize) });
      setStatus({ state: 'success', result });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ state: 'error', notConfigured: err instanceof BackendNotConfiguredError, message: err.message });
    }
  }

  const fieldProps = (key) => ({
    id: `res-${key}`,
    name: key,
    value: form[key],
    onChange: set(key),
    'aria-invalid': errors[key] ? 'true' : undefined,
    'aria-describedby': errors[key] ? `res-${key}-error` : undefined,
  });

  const maxParty = config?.policy.maxPartySize ?? 12;

  return (
    <>
      <section className="page-hero pattern">
        <div className="container">
          <span className="eyebrow">Reservations</span>
          <h1>Book your table.</h1>
          <p>Tell us when you'd like to join us. We'll confirm your table once it's been checked against our availability.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container booking-layout">
          <form className="form form--card" onSubmit={onSubmit} noValidate aria-describedby="res-required-note">
            <p id="res-required-note" className="field--full" style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)' }}>
              Fields marked <span className="gold">*</span> are required.
            </p>

            <Field id="res-name" label="Full name" required error={errors.name}>
              <input {...fieldProps('name')} autoComplete="name" />
            </Field>
            <Field id="res-email" label="Email" required error={errors.email}>
              <input {...fieldProps('email')} type="email" autoComplete="email" inputMode="email" />
            </Field>
            <Field id="res-phone" label="Phone" required error={errors.phone}>
              <input {...fieldProps('phone')} type="tel" autoComplete="tel" placeholder="+234" />
            </Field>
            <Field id="res-partySize" label="Guests" required error={errors.partySize} hint={`Up to ${maxParty} online. Larger groups: use Events.`}>
              <select {...fieldProps('partySize')}>
                {Array.from({ length: maxParty }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>)}
              </select>
            </Field>
            <Field id="res-date" label="Date" required error={errors.date}>
              <input {...fieldProps('date')} type="date" min={minDate} max={maxDate} />
            </Field>
            <Field id="res-time" label="Preferred time" required error={errors.time}
              hint={form.date && !slots.length ? 'No seating times left on this date. Try another day.' : 'Availability is confirmed when you submit.'}>
              <select {...fieldProps('time')} disabled={!form.date || !slots.length}>
                <option value="">{form.date ? 'Select a time' : 'Choose a date first'}</option>
                {slots.map((s) => <option key={s} value={s}>{formatTime(s)}</option>)}
              </select>
            </Field>

            <div className="field field--full">
              <fieldset>
                <legend>Seating preference</legend>
                <div className="radio-row">
                  {config?.seating.map((s) => (
                    <label className="radio-pill" key={s.id}>
                      <input type="radio" name="seating" value={s.id} checked={form.seating === s.id} onChange={set('seating')} />
                      <span>{s.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            <Field id="res-occasion" label="Occasion">
              <select {...fieldProps('occasion')}>
                {config?.occasions.map((o) => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field id="res-dietary" label="Dietary notes">
              <input {...fieldProps('dietary')} placeholder="e.g. nut allergy, vegetarian" />
            </Field>
            <Field id="res-request" label="Special request" full error={errors.request} hint="Optional. Max 500 characters.">
              <textarea {...fieldProps('request')} maxLength={500} />
            </Field>

            <div className="honeypot" aria-hidden="true">
              <label htmlFor="res-company">Company</label>
              <input id="res-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} />
            </div>

            {status.state === 'invalid' && <Notice tone="error" title="Please check the highlighted fields." />}
            {status.state === 'error' && (
              status.notConfigured ? (
                <Notice tone="error" title="Online booking isn't open yet.">
                  Your booking was <strong>not</strong> saved. Please call or email the restaurant to reserve a table.
                </Notice>
              ) : (
                <Notice tone="error" title="We couldn't complete your booking.">
                  {status.message} Your booking was not saved. Please try again.
                </Notice>
              )
            )}
            {status.state === 'success' && (
              <Notice tone="success" title={status.result.status === 'confirmed' ? 'Your table is confirmed.' : 'Booking request received.'}>
                Reference <strong>{status.result.reference}</strong>. We've emailed the details to you.
                {status.result.status !== 'confirmed' && ' The team will confirm shortly.'}
              </Notice>
            )}

            <div className="form-actions">
              <button className="btn" type="submit" disabled={status.state === 'loading'}>
                {status.state === 'loading' ? 'Checking availability…' : 'Request Booking'}
              </button>
            </div>
          </form>

          <aside className="card aside-card" aria-label="Booking information">
            <h2 style={{ fontSize: 'var(--fs-xl)' }}>Good to know</h2>
            <ul style={{ margin: 0, paddingLeft: '1.1rem', color: 'var(--text-muted)', display: 'grid', gap: '0.4rem', fontSize: 'var(--fs-sm)' }}>
              <li>Tables are held for 15 minutes. <Placeholder>Confirm policy</Placeholder></li>
              <li>Cancellation and deposit policy <Placeholder>To be supplied</Placeholder></li>
              <li>For groups over {maxParty}, use the Events page.</li>
            </ul>
            <h3 style={{ fontSize: 'var(--fs-lg)', marginTop: '0.5rem' }}>Opening hours</h3>
            <OpeningHours hours={config?.hours} />
            <h3 style={{ fontSize: 'var(--fs-lg)', marginTop: '0.5rem' }}>Prefer to call?</h3>
            {profile.data && <ContactLines profile={profile.data} />}
          </aside>
        </div>
      </section>
    </>
  );
}
