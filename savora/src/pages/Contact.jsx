import { useState } from 'react';
import ContactLines from '../components/ContactLines';
import Icon from '../components/Icon';
import OpeningHours from '../components/OpeningHours';
import { Field, Notice } from '../components/ui';
import { isValidEmail } from '../lib/format';
import { useAsync } from '../lib/useAsync';
import { BackendNotConfiguredError, getRestaurantProfile, submitContactMessage } from '../services';

const EMPTY = { name: '', email: '', subject: '', message: '', company: '' };

export default function Contact() {
  const { data: profile } = useAsync(getRestaurantProfile);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ state: 'idle' });
  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };
  const fp = (k) => ({ id: `ct-${k}`, value: form[k], onChange: set(k), 'aria-invalid': errors[k] ? 'true' : undefined, 'aria-describedby': errors[k] ? `ct-${k}-error` : undefined });

  async function onSubmit(e) {
    e.preventDefault();
    const er = {};
    if (form.name.trim().length < 2) er.name = 'Enter your name.';
    if (!isValidEmail(form.email)) er.email = 'Enter a valid email address.';
    if (form.message.trim().length < 10) er.message = 'Write a message of at least 10 characters.';
    setErrors(er);
    if (Object.keys(er).length) return setStatus({ state: 'invalid' });
    setStatus({ state: 'loading' });
    try {
      await submitContactMessage(form);
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
          <span className="eyebrow">Contact</span>
          <h1>Get in touch.</h1>
          <p>Questions, feedback or press. To book a table, use the reservations page.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container booking-layout">
          <form className="form form--card" onSubmit={onSubmit} noValidate>
            <Field id="ct-name" label="Name" required error={errors.name}><input {...fp('name')} autoComplete="name" /></Field>
            <Field id="ct-email" label="Email" required error={errors.email}><input {...fp('email')} type="email" autoComplete="email" /></Field>
            <Field id="ct-subject" label="Subject" full><input {...fp('subject')} maxLength={120} /></Field>
            <Field id="ct-message" label="Message" required full error={errors.message}><textarea {...fp('message')} maxLength={2000} /></Field>
            <div className="honeypot" aria-hidden="true"><label htmlFor="ct-company">Company</label><input id="ct-company" tabIndex={-1} autoComplete="off" value={form.company} onChange={set('company')} /></div>

            {status.state === 'invalid' && <Notice tone="error" title="Please check the highlighted fields." />}
            {status.state === 'error' && (
              <Notice tone="error" title={status.notConfigured ? 'The contact form isn\'t connected yet.' : 'We couldn\'t send your message.'}>
                Your message was <strong>not</strong> sent. {status.notConfigured ? 'Please use the phone number or email shown here.' : status.message}
              </Notice>
            )}
            {status.state === 'success' && <Notice tone="success" title="Message sent.">Thanks, we'll reply by email.</Notice>}
            <div className="form-actions">
              <button className="btn" type="submit" disabled={status.state === 'loading'}>{status.state === 'loading' ? 'Sending…' : 'Send Message'}</button>
            </div>
          </form>

          <aside className="card aside-card">
            <h2 style={{ fontSize: 'var(--fs-xl)' }}>Visit SAVORA</h2>
            {profile && <ContactLines profile={profile} />}
            <div className="map-box" style={{ minHeight: 180 }}>
              <div>
                <Icon name="pin" width="28" height="28" style={{ color: 'var(--gold)', margin: '0 auto 0.5rem' }} />
                <p>Map shows here once the verified address is added.</p>
              </div>
            </div>
            <h3 style={{ fontSize: 'var(--fs-lg)' }}>Opening hours</h3>
            <OpeningHours hours={profile?.hours} />
          </aside>
        </div>
      </section>
    </>
  );
}
