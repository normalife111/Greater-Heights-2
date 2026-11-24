import Icon from './Icon';

export function Logo({ size = 64 }) {
  return (
    <img
      src="/brand/savora-logo-badge.png"
      width={size}
      height={size}
      alt="SAVORA Afro-Continental Bistro"
    />
  );
}

export function SectionHeading({ eyebrow, title, intro, center = false, as: Tag = 'h2' }) {
  return (
    <header className={`heading${center ? ' heading--center' : ''}`}>
      <span className="heading__rule" aria-hidden="true" />
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag>{title}</Tag>
      {intro && <p>{intro}</p>}
    </header>
  );
}

/** Marks content that the owner must replace before launch. */
export function Placeholder({ children = 'To be supplied' }) {
  return <span className="placeholder">{children}</span>;
}

export function SampleBanner({ children }) {
  return (
    <div className="sample-banner" role="note">
      <Icon name="info" width="20" height="20" style={{ flex: 'none', color: 'var(--gold)' }} />
      <p><strong>Sample content.</strong> {children}</p>
    </div>
  );
}

/**
 * Photo frame. Shows the approved image when `src` is set, otherwise a warm
 * branded placeholder that names the shot that is needed.
 */
export function Photo({ src, alt, label, className = '', style }) {
  return (
    <div className={`photo ${className}`} style={style}>
      {src ? (
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      ) : (
        <span className="photo__label" role="img" aria-label={alt}>
          <b>Photo needed</b> · {label || alt}
        </span>
      )}
    </div>
  );
}

export function Notice({ tone = 'info', title, children }) {
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {title && <strong>{title}</strong>}
      {children && <div>{children}</div>}
    </div>
  );
}

export function Field({ id, label, required, error, hint, full, children }) {
  return (
    <div className={`field${full ? ' field--full' : ''}`}>
      <label htmlFor={id}>
        {label} {required && <span className="req" aria-hidden="true">*</span>}
      </label>
      {children}
      {hint && !error && <span className="field__hint" id={`${id}-hint`}>{hint}</span>}
      {error && <span className="field__error" id={`${id}-error`}>{error}</span>}
    </div>
  );
}

export function LoadState({ loading, error, children }) {
  if (loading) return <p className="empty" aria-busy="true">Loading…</p>;
  if (error) return <p className="empty" role="alert">We couldn't load this right now. Please refresh the page.</p>;
  return children;
}
