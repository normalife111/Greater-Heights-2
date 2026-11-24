import { useEffect, useRef, useState } from 'react';
import { LoadState, Photo, SampleBanner } from '../components/ui';
import { useAsync } from '../lib/useAsync';
import { getGallery } from '../services';

export default function Gallery() {
  const { data, loading, error, isSample } = useAsync(getGallery);
  const [cat, setCat] = useState('All');
  const [index, setIndex] = useState(null);
  const dialog = useRef(null);
  const images = data?.images.filter((i) => cat === 'All' || i.category === cat) ?? [];
  const current = index != null ? images[index] : null;

  useEffect(() => {
    const d = dialog.current;
    if (current && !d.open) d.showModal();
    if (!current && d?.open) d.close();
  }, [current]);

  const step = (dir) => setIndex((i) => (i + dir + images.length) % images.length);
  const onKey = (e) => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  };

  return (
    <>
      <section className="page-hero pattern">
        <div className="container">
          <span className="eyebrow">Gallery</span>
          <h1>The room, the plates, the people.</h1>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="container">
          {isSample && <SampleBanner>Approved photography will be uploaded from the admin dashboard. Each frame below names the shot that's needed.</SampleBanner>}
          <div className="chips" role="group" aria-label="Filter gallery" style={{ marginBottom: 'var(--space-4)' }}>
            {data?.categories.map((c) => (
              <button key={c} className="chip" aria-pressed={cat === c} onClick={() => { setCat(c); setIndex(null); }}>{c}</button>
            ))}
          </div>
          <LoadState loading={loading} error={error}>
            <div className="gallery-grid">
              {images.map((img, i) => (
                <button key={img.id} className="gallery-item" onClick={() => setIndex(i)} aria-label={`Open image: ${img.alt}`}>
                  <Photo src={img.src} alt={img.alt} label={`${img.category}: ${img.alt}`} />
                </button>
              ))}
            </div>
          </LoadState>
        </div>
      </section>

      <dialog ref={dialog} className="dialog" onClose={() => setIndex(null)} onKeyDown={onKey}
        onClick={(e) => e.target === dialog.current && dialog.current.close()} aria-label="Image viewer">
        {current && (
          <div className="dialog__panel" style={{ position: 'relative' }}>
            <button className="dialog__close" onClick={() => dialog.current.close()} aria-label="Close">×</button>
            <Photo src={current.src} alt={current.alt} label={current.alt} style={{ minHeight: 'min(60vh, 460px)' }} />
            <div className="dialog__body" style={{ gridTemplateColumns: 'auto 1fr auto', alignItems: 'center' }}>
              <button className="btn btn--outline btn--sm" onClick={() => step(-1)} aria-label="Previous image">←</button>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{current.alt} · {index + 1} / {images.length}</p>
              <button className="btn btn--outline btn--sm" onClick={() => step(1)} aria-label="Next image">→</button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
