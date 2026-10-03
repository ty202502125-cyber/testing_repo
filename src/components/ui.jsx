import Glyph from './Glyph';

/** Filled button is the single primary action on a view; outline and text stay quiet. */
export function Button({ children, variant = 'primary', className = '', ...props }) {
  return (
    <button className={`button ${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

/** Status is always a word plus a colour dot — never a colour alone. */
export function Status({ tone = 'neutral', children, className = '' }) {
  return (
    <span className={`status ${tone} ${className}`.trim()}>
      <span className="status-dot" aria-hidden="true" />
      {children}
    </span>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function SectionHead({ title, meta, action }) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
      </div>
      {action || (meta ? <span className="section-meta">{meta}</span> : null)}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light';
  const label = isLight ? 'Switch to dark theme' : 'Switch to light theme';
  return (
    <button type="button" className="theme-toggle" onClick={onToggle} aria-label={label} title={label}>
      {isLight ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
      ) : (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
      )}
    </button>
  );
}

export function QuietLink({ children, onClick, className = '' }) {
  return (
    <button type="button" className={`quiet-link ${className}`.trim()} onClick={onClick}>
      {children}
      <Glyph name="arrow" size={13} />
    </button>
  );
}

export function PageIntro({ title, text, action }) {
  return (
    <div className="page-intro">
      <div>
        <h1>{title}</h1>
        {text ? <p>{text}</p> : null}
      </div>
      {action}
    </div>
  );
}
