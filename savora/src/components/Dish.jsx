import { useEffect, useRef } from 'react';
import { formatPrice } from '../lib/format';
import { Photo } from './ui';

/** `showPhoto` keeps the 'photo needed' frame for items without an image (used for the home page highlights). */
export function DishCard({ item, onOpen, showPhoto = false }) {
  return (
    <button
      type="button"
      className={`dish${item.available ? '' : ' dish--unavailable'}`}
      onClick={() => onOpen?.(item)}
      aria-label={`${item.name}, ${formatPrice(item.price)}${item.available ? '' : ', currently unavailable'}. View details`}
    >
      {(item.image || showPhoto) && <Photo src={item.image} alt={item.name} label={item.name} />}
      <div className="dish__body">
        <div className="dish__top">
          <span className="dish__name">{item.name}</span>
          <span className="dish__price">{formatPrice(item.price)}</span>
        </div>
        {item.description && <p className="dish__desc">{item.description}</p>}
        <div className="dish__tags">
          {!item.available && <span className="unavailable-pill">Unavailable today</span>}
          {item.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
        </div>
      </div>
    </button>
  );
}

export function DishDialog({ item, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (item && !d.open) d.showModal();
    if (!item && d.open) d.close();
  }, [item]);

  return (
    <dialog
      ref={ref}
      className="dialog"
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current.close()}
      aria-labelledby="dish-dialog-title"
    >
      {item && (
        <div className="dialog__panel" style={{ position: 'relative', paddingTop: item.image ? 0 : 'var(--space-4)' }}>
          <button className="dialog__close" onClick={() => ref.current.close()} aria-label="Close">×</button>
          {item.image && <Photo src={item.image} alt={item.name} label={`${item.name}, large`} />}
          <div className="dialog__body">
            <div className="dish__top">
              <h2 id="dish-dialog-title" style={{ fontSize: 'var(--fs-2xl)' }}>{item.name}</h2>
              <span className="dish__price" style={{ fontSize: 'var(--fs-xl)' }}>{formatPrice(item.price)}</span>
            </div>
            {item.description && <p style={{ color: 'var(--text-muted)' }}>{item.description}</p>}
            {item.allergens && <p style={{ fontSize: 'var(--fs-sm)' }}><strong>Allergens:</strong> {item.allergens}</p>}
            <div className="dish__tags">
              {!item.available && <span className="unavailable-pill">Unavailable today</span>}
              {item.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
              {item.sample && <span className="placeholder">Sample dish</span>}
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Menu-board row for items without a photo: name, dotted leader, price. */
export function MenuRow({ item }) {
  return (
    <li className={`menu-row${item.available ? '' : ' menu-row--unavailable'}`}>
      <div className="menu-row__top">
        <span className="menu-row__name">{item.name}</span>
        <span className="menu-row__dots" aria-hidden="true" />
        <span className="menu-row__price">{formatPrice(item.price)}</span>
      </div>
      {(item.description || item.tags.length > 0 || !item.available) && (
        <p className="menu-row__meta">
          {item.description}
          {item.tags.map((t) => <span className="tag" key={t}>{t}</span>)}
          {!item.available && <span className="unavailable-pill">Unavailable today</span>}
        </p>
      )}
    </li>
  );
}
