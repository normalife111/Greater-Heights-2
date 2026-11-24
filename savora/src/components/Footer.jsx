import { Link } from 'react-router-dom';
import { useAsync } from '../lib/useAsync';
import { getRestaurantProfile } from '../services';
import { NAV } from './Header';
import ContactLines from './ContactLines';
import Newsletter from './Newsletter';
import { Logo, Placeholder } from './ui';

export default function Footer() {
  const { data: profile } = useAsync(getRestaurantProfile);
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer pattern">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Logo size={96} />
            <p>Afro-Continental Bistro. Where every flavour tells a story.</p>
          </div>

          <div>
            <h3>Explore</h3>
            <ul>
              {NAV.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
            </ul>
          </div>

          <div>
            <h3>Visit</h3>
            {profile && <ContactLines profile={profile} />}
            <h3 style={{ marginTop: '1.5rem' }}>Follow</h3>
            <ul>
              {profile?.social.map((s) => (
                <li key={s.label}>
                  {s.url ? <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a> : <span style={{ color: 'var(--text-faint)' }}>{s.label} <Placeholder>link needed</Placeholder></span>}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3>Newsletter</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', marginBottom: '0.8rem' }}>
              New menus, events and tables worth booking early.
            </p>
            <Newsletter />
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {year} SAVORA Afro-Continental Bistro.</span>
          <span>Privacy policy and terms to be added before launch.</span>
        </div>
      </div>
    </footer>
  );
}
