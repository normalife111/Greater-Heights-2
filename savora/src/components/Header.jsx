import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
import { Logo } from './ui';

export const NAV = [
  { to: '/', label: 'Home', end: true },
  { to: '/our-story', label: 'Our Story' },
  { to: '/menu', label: 'Menu' },
  { to: '/reservations', label: 'Reservations' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/events', label: 'Events' },
  { to: '/contact', label: 'Contact' },
];

export default function Header() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
    <header className={`site-header${solid || open || pathname !== '/' ? ' site-header--solid' : ''}`}>
      <div className="container site-header__inner">
        <Link to="/" className="logo-link" aria-label="SAVORA home">
          <Logo />
        </Link>

        <nav className="nav" aria-label="Main">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}>{n.label}</NavLink>
          ))}
        </nav>

        {/* Customer account link is added in Phase 3 when sign-in exists — no dead buttons. */}
        <Link to="/reservations" className="btn btn--sm btn--header">
          <Icon name="calendar" /> Book a Table
        </Link>

        <button
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((o) => !o)}
        >
          <span /><span />
        </button>
      </div>
    </header>

      {/* Rendered outside <header>: its backdrop-filter would trap a fixed child inside the bar. */}
      <nav id="mobile-nav" className={`mobile-nav${open ? ' open' : ''}`} aria-label="Mobile">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={n.end} tabIndex={open ? 0 : -1}>{n.label}</NavLink>
        ))}
        <Link to="/reservations" className="btn" tabIndex={open ? 0 : -1}>
          <Icon name="calendar" /> Book a Table
        </Link>
      </nav>
    </>
  );
}
