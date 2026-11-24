import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page-hero pattern" style={{ minHeight: '70vh' }}>
      <div className="container">
        <span className="eyebrow">404</span>
        <h1>This page isn't on the menu.</h1>
        <p style={{ marginBottom: '2rem' }}>The link may be old or mistyped.</p>
        <Link to="/" className="btn">Back to Home</Link>
      </div>
    </section>
  );
}
