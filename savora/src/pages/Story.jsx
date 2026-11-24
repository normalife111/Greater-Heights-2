import { Link } from 'react-router-dom';
import Icon from '../components/Icon';
import { Photo, Placeholder, SampleBanner, SectionHeading } from '../components/ui';

const values = [
  { title: 'Flavour first', text: 'Bold seasoning, slow cooking and honest ingredients.' },
  { title: 'Two traditions, one table', text: 'African classics and continental technique, side by side.' },
  { title: 'Hospitality', text: 'Every guest is welcomed like they have been here before.' },
];

export default function Story() {
  return (
    <>
      <section className="page-hero pattern">
        <div className="container">
          <span className="eyebrow">Our Story</span>
          <h1>Afro-Continental, by design.</h1>
          <p>SAVORA brings the depth of African cooking together with the craft of continental kitchens.</p>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div className="prose">
            <span className="heading__rule" aria-hidden="true" />
            <h2>How SAVORA began</h2>
            <p><Placeholder>Founding story to be supplied</Placeholder></p>
            <p>This section tells the restaurant's real history: who started it, why, and what it set out to do. We won't publish claims about SAVORA's history until the owner has written or approved them.</p>
          </div>
          <Photo alt="Kitchen team at work" label="Kitchen pass or team at work" />
        </div>
      </section>

      <section className="section section--raised">
        <div className="container">
          <SectionHeading eyebrow="Philosophy" title="What we cook for" intro="Draft values for the owner to confirm or rewrite." />
          <div className="card-grid">
            {values.map((v) => (
              <article className="card" key={v.title}>
                <h3>{v.title}</h3>
                <p>{v.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeading eyebrow="The team" title="Chefs & Team" />
          <SampleBanner>Chef and team profiles appear here once portraits and biographies are approved.</SampleBanner>
          <div className="card-grid">
            {['Head Chef', 'Sous Chef', 'Restaurant Manager'].map((role) => (
              <article className="card" key={role} style={{ padding: 0, overflow: 'hidden' }}>
                <Photo alt={`${role} portrait`} label={`${role} portrait`} style={{ borderRadius: 0, minHeight: 260 }} />
                <div style={{ padding: 'var(--space-3)', display: 'grid', gap: '0.4rem' }}>
                  <h3>{role}</h3>
                  <p><Placeholder>Name & biography to be supplied</Placeholder></p>
                </div>
              </article>
            ))}
          </div>
          <p style={{ marginTop: 'var(--space-6)' }}>
            <Link to="/reservations" className="btn"><Icon name="calendar" /> Book a Table</Link>
          </p>
        </div>
      </section>
    </>
  );
}
