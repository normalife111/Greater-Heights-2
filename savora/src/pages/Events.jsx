import { useState } from 'react';
import { Field, Notice, Photo, SectionHeading } from '../components/ui';
import { isoDate, isValidEmail, isValidPhone } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { BackendNotConfiguredError, getEventTypes, submitEventEnquiry } from '../services';

const EMPTY = { name: '', email: '', phone: '', eventType: '', date: '', guests: '', budget: '', message: '', company: '' };
const BUDGETS = ['Under ₦250,000', '₦250,000 – ₦500,000', '₦500,000 – ₦1,000,000', 'Over ₦1,000,000', 'Not sure yet'];

export default function Events() {
  const { data: types } = useAsync(getEventTypes);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' });

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };
  const fp = (k) => ({ id: `ev-${k}`, value: form[k], onChange: set(k), 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `ev-${k}-error` : undefined });

  async function onSubmit(e) {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Enter your name.';
    if (!isValidEmail(form.email)) er.email = 'Enter a valid email address.';
    if (!isValidPhone(form.phone)) er.phone = 'Enter a valid phone number.';
    if (!form.eventType) er.eventType = 'Choose an event type.';
    if (!form.guests || Number(form.guests) < 1) er.guests = 'Estimate the number of guests.';
    if (form.message.trim().length < 10) er.message = 'Tell us a little about your event (at least 10 characters).';
    setErrors(er);
    if (Object.keys(er).length) return setStatus({ state: 'invalid' });
    setStatus({ state: 'loading' });
    try {
      await submitEventEnquiry({ ...form, guests: Number(form.guests) });
      setStatus({ state: 'success' });
      setForm(EMPTY);
    } catch (err) {
      setStatus({ state: 'error', notConfigured: err instanceof BackendNotConfiguredError, message: err.message });
    }
  }

  return (
    <>
      <section className="page-hero pattern">
        <div className="container">
          <span className="eyebrow">Events &amp; Private Dining</span>
          <h1>Bring the celebration to SAVORA.</h1>
          <p>Send us an enquiry and our events team will get back to you. An enquiry is not a confirmed booking.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {types?.map((t) => (
              <article className="card event-card" key={t.id}>
                <Photo alt={t.title} label={`${t.title} setting`} />
                <div className="event-card__body">
                  <h3>{t.title}</h3>
                  <p>{t.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--raised" id="enquire">
        <div className="container" style={{ maxWidth: 900 }}>
          <SectionHeading eyebrow="Enquire" title="Tell us about your event" />
          <form className="form form--card" onSubmit={onSubmit} noValidate>
            <Field id="ev-name" label="Name" required error={errors.name}><input {...fp('name')} autoComplete="name" /></Field>
            <Field id="ev-email" label="Email" required error={errors.email}><input {...fp('email')} type="email" autoComplete="email" /></Field>
            <Field id="ev-phone" label="Phone" required error={errors.phone}><input {...fp('phone')} type="tel" autoComplete="tel" /></Field>
            <Field id="ev-eventType" label="Event type" required error={errors.eventType}>
              <select {...fp('eventType')}>
                <option value="">Select</option>
                {types?.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                <option value="other">Other</option>
              </select>
            </Field>
            <Field id="ev-date" label="Preferred date"><input {...fp('date')} type="date" min={isoDate(new Date())} /></Field>
            <Field id="ev-guests" label="Estimated guests" required error={errors.guests}><input {...fp('guests')} type="number" min="1" inputMode="numeric" /></Field>
            <Field id="ev-budget" label="Budget range" full>
              <select {...fp('budget')}>
                <option value="">Select (optional)</option>
                {BUDGETS.map((b) => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field id="ev-message" label="Message" required full error={errors.message}><textarea {...fp('message')} maxLength={2000} /></Field>
            <div className="honeypot" aria-hidden="true"><label htmlFor="ev-company">Company</label><input id="ev-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} /></div>

            {status.state === 'invalid' && <Notice tone="error" title="Please check the highlighted fields." />}
            {status.state === 'error' && (
              <Notice tone="error" title={status.notConfigured ? 'Online enquiries aren\'t open yet.' : 'We couldn\'t send your enquiry.'}>
                Your enquiry was <strong>not</strong> sent. {status.notConfigured ? 'Please contact the restaurant directly.' : status.message}
              </Notice>
            )}
            {status.state === 'success' && <Notice tone="success" title="Enquiry received.">Our events team will contact you. This is not yet a confirmed booking.</Notice>}

            <div className="form-actions">
              <button className="btn" type="submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? 'Sending…' : 'Send Enquiry'}</button>
            </div>
          </form>
        </div>
      </section>
    </>
  );
}
