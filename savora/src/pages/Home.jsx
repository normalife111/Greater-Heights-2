import { useState } from 'react';
import heroImage from '../assets/hero-savora.jpg';
import { Link } from 'react-router-dom';
import ContactLines from '../components/ContactLines';
import { DishCard, DishDialog } from '../components/Dish';
import Icon from '../components/Icon';
import OpeningHours from '../components/OpeningHours';
import { LoadState, Photo, SampleBanner, SectionHeading } from '../components/ui';
import { useAsync } from '../lib/useAsync';
import { getFeaturedDishes, getGallery, getHomeContent, getRestaurantProfile } from '../services';

export default function Home() {
  const home = useAsync(getHomeContent);
  const featured = useAsync(() => getFeaturedDishes(4));
  const gallery = useAsync(getGallery);
  const profile = useAsync(getRestaurantProfile);
  const [openDish, setOpenDish] = useState(null);
  const c = home.data;

  return (
    <>
      {/* HERO — follows Reference B: dark, warm amber light, serif headline with gold accent */}
      <section className="hero" aria-labelledby="hero-title">
        <img className="hero__bg" src={heroImage} alt="Smoky jollof rice with grilled chicken and plantain in the SAVORA dining room" fetchpriority="high" />
        <div className="hero__shade" aria-hidden="true" />
        <div className="container hero__content">
          <h1 id="hero-title">
            {c ? <>{c.heroTitleLead} <em className="gold">{c.heroTitleAccent}</em> {c.heroTitleTail}</> : 'SAVORA'}
          </h1>
          <span className="hero__swash" aria-hidden="true" />
          <p className="hero__lede">{c?.heroLede}</p>
          <div className="hero__actions">
            <Link to="/reservations" className="btn"><Icon name="calendar" /> Book Your Table <Icon name="arrow" /></Link>
            <Link to="/menu" className="btn btn--outline"><Icon name="utensils" /> Explore Our Menu</Link>
          </div>
          <a href="#story" className="scroll-cue"><span className="scroll-cue__mouse" aria-hidden="true" /> Scroll to explore</a>
        </div>
      </section>

      {/* STORY TEASER */}
      <section id="story" className="section pattern" aria-labelledby="story-title">
        <div className="container split">
          <Photo alt="SAVORA dining room" label="Dining room interior with pendant lights" />
          <div className="prose">
            <span className="heading__rule" aria-hidden="true" />
            <h2 id="story-title">{c?.introTitle || 'Our Story'}</h2>
            {c?.intro.map((p, i) => <p key={i}>{p}</p>)}
            <div><Link to="/our-story" className="btn btn--outline">Learn More <Icon name="arrow" /></Link></div>
          </div>
        </div>
      </section>

      {/* FEATURED DISHES */}
      <section className="section section--raised" aria-labelledby="featured-title">
        <div className="container">
          <SectionHeading eyebrow="Chef's selection" title={<span id="featured-title">Signature Dishes</span>} intro="A taste of what comes out of the SAVORA kitchen." />
          {featured.isSample && <SampleBanner>These dishes and prices are examples. The real menu is managed by the restaurant.</SampleBanner>}
          <LoadState loading={featured.loading} error={featured.error}>
            <div className="dish-grid">
              {featured.data?.map((d) => <DishCard key={d.id} item={d} onOpen={setOpenDish} showPhoto />)}
            </div>
          </LoadState>
          <p style={{ marginTop: 'var(--space-4)' }}><Link to="/menu" className="link-arrow">See the full menu <Icon name="arrow" width="18" /></Link></p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section" aria-labelledby="reviews-title">
        <div className="container">
          <SectionHeading center eyebrow="Guests" title={<span id="reviews-title">Kind Words</span>} />
          <div className="card-grid">
            {c?.testimonials.map((t) => (
              <figure className="card" key={t.id} style={{ margin: 0 }}>
                <blockquote className="quote" style={{ margin: 0 }}>“{t.quote}”</blockquote>
                <figcaption className="quote-by">— {t.author}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* GALLERY + EVENTS TEASER */}
      <section className="section section--raised" aria-labelledby="gallery-title">
        <div className="container">
          <SectionHeading eyebrow="Gallery" title={<span id="gallery-title">A Look Inside</span>} />
          <div className="gallery-grid">
            {gallery.data?.images.slice(0, 4).map((g) => <Photo key={g.id} src={g.src} alt={g.alt} style={{ aspectRatio: '4/3', minHeight: 0 }} />)}
          </div>
          <p style={{ marginTop: 'var(--space-4)' }}><Link to="/gallery" className="link-arrow">Open the gallery <Icon name="arrow" width="18" /></Link></p>

          <div className="cta-band" style={{ marginTop: 'var(--space-8)' }}>
            <div>
              <h2>Celebrations &amp; Private Dining</h2>
              <p>Birthdays, anniversaries, corporate dinners and private events. Tell us what you're planning.</p>
            </div>
            <div><Link to="/events" className="btn">Plan an Event <Icon name="arrow" /></Link></div>
          </div>
        </div>
      </section>

      {/* VISIT */}
      <section className="section pattern" aria-labelledby="visit-title">
        <div className="container">
          <SectionHeading eyebrow="Visit" title={<span id="visit-title">Find Us</span>} />
          <div className="info-grid">
            <div className="info-block">
              <h3>Contact</h3>
              {profile.data && <ContactLines profile={profile.data} />}
            </div>
            <div className="info-block">
              <h3>Opening Hours</h3>
              <OpeningHours hours={profile.data?.hours} />
            </div>
            <div className="map-box">
              <div>
                <Icon name="pin" width="32" height="32" style={{ color: 'var(--gold)', margin: '0 auto 0.6rem' }} />
                <p>The map appears here once the verified address is added.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <DishDialog item={openDish} onClose={() => setOpenDish(null)} />
    </>
  );
}
