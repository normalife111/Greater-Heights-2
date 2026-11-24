import { useState } from 'react';
import { isValidEmail } from '../lib/format';
import { BackendNotConfiguredError, subscribeNewsletter } from '../services';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState(''); // honeypot
  const [status, setStatus] = useState({ state: 'idle', msg: '' });

  async function onSubmit(e) {
    e.preventDefault();
    if (!isValidEmail(email)) return setStatus({ state: 'error', msg: 'Enter a valid email address.' });
    if (!consent) return setStatus({ state: 'error', msg: 'Please tick the box to agree to receive emails.' });
    setStatus({ state: 'loading', msg: '' });
    try {
      await subscribeNewsletter({ email: email.trim().toLowerCase(), consent, company });
      setStatus({ state: 'success', msg: 'Check your inbox to confirm your subscription.' });
      setEmail('');
    } catch (err) {
      setStatus({
        state: 'error',
        msg: err instanceof BackendNotConfiguredError
          ? 'Newsletter sign-up opens soon. Nothing was saved.'
          : err.message,
      });
    }
  }

  return (
    <form className="newsletter" onSubmit={onSubmit} noValidate>
      <label htmlFor="newsletter-email" className="visually-hidden">Email address</label>
      <div className="newsletter__row">
        <input id="newsletter-email" type="email" autoComplete="email" placeholder="Your email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn--sm" type="submit" disabled={status.state === 'loading'}>
          {status.state === 'loading' ? 'Sending…' : 'Subscribe'}
        </button>
      </div>
      <div className="honeypot" aria-hidden="true">
        <label htmlFor="newsletter-company">Company</label>
        <input id="newsletter-company" tabIndex={-1} autoComplete="off" value={company} onChange={(e) => setCompany(e.target.value)} />
      </div>
      <label className="check" htmlFor="newsletter-consent">
        <input id="newsletter-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        I agree to receive news and offers from SAVORA. Unsubscribe any time.
      </label>
      <p className="newsletter__msg" role="status" aria-live="polite" style={{ color: status.state === 'error' ? 'var(--danger)' : 'var(--success)' }}>
        {status.msg}
      </p>
    </form>
  );
}
