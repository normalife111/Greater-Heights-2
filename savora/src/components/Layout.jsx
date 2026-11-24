import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Footer from './Footer';
import Header from './Header';

const TITLES = {
  '/': 'SAVORA — Afro-Continental Bistro',
  '/our-story': 'Our Story — SAVORA',
  '/menu': 'Menu — SAVORA',
  '/reservations': 'Book a Table — SAVORA',
  '/gallery': 'Gallery — SAVORA',
  '/events': 'Events & Private Dining — SAVORA',
  '/contact': 'Contact — SAVORA',
};

export default function Layout() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    document.title = TITLES[pathname] || 'Page not found — SAVORA';
    if (hash) document.querySelector(hash)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
