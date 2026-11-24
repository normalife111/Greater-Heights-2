import { useMemo, useState } from 'react';
import { DishCard, DishDialog } from '../components/Dish';
import Icon from '../components/Icon';
import { LoadState, SampleBanner } from '../components/ui';
import { useAsync } from '../lib/useAsync';
import { getMenu } from '../services';

export default function Menu() {
  const { data, loading, error, isSample } = useAsync(getMenu);
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [openDish, setOpenDish] = useState(null);

  const grouped = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.categories
      .filter((c) => category === 'all' || c.id === category)
      .map((c) => ({
        ...c,
        items: data.items.filter(
          (i) => i.category === c.id && (!q || `${i.name} ${i.description} ${i.tags.join(' ')}`.toLowerCase().includes(q)),
        ),
      }))
      .filter((c) => c.items.length);
  }, [data, category, query]);

  return (
    <>
      <section className="page-hero pattern">
        <div className="container">
          <span className="eyebrow">The Menu</span>
          <h1>Bold flavours, both sides of the pass.</h1>
          <p>All prices in Naira. Tell your server about any allergies before ordering.</p>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          {isSample && <SampleBanner>Dishes and prices shown are examples, not SAVORA's real menu. The restaurant will manage the live menu from the admin dashboard.</SampleBanner>}

          <div className="menu-controls">
            <div className="chips" role="group" aria-label="Filter by category">
              <button className="chip" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>All</button>
              {data?.categories.map((c) => (
                <button key={c.id} className="chip" aria-pressed={category === c.id} onClick={() => setCategory(c.id)}>{c.name}</button>
              ))}
            </div>
            <div className="search">
              <Icon name="search" />
              <label htmlFor="menu-search" className="visually-hidden">Search the menu</label>
              <input id="menu-search" type="search" placeholder="Search dishes, e.g. jollof" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          <LoadState loading={loading} error={error}>
            {grouped.length === 0 ? (
              <div className="empty">
                <p>No dishes match “{query}”.</p>
                <button className="btn btn--outline btn--sm" style={{ marginTop: '1rem' }} onClick={() => { setQuery(''); setCategory('all'); }}>Clear filters</button>
              </div>
            ) : (
              grouped.map((c) => (
                <section className="menu-category" key={c.id} aria-labelledby={`cat-${c.id}`}>
                  <h2 id={`cat-${c.id}`}>{c.name}</h2>
                  <div className="dish-grid">
                    {c.items.map((i) => <DishCard key={i.id} item={i} onOpen={setOpenDish} />)}
                  </div>
                </section>
              ))
            )}
          </LoadState>
        </div>
      </section>

      <DishDialog item={openDish} onClose={() => setOpenDish(null)} />
    </>
  );
}
