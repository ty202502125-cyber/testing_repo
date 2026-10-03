import Glyph from './Glyph';
import { ThemeToggle } from './ui';
import { initials } from '../utils/format';

/**
 * Persistent navigation. Each role gets its own destination list, and the
 * review queue shows its real outstanding count rather than a decorative dot.
 */
export default function AppSidebar({
  user,
  admin,
  navItems,
  pendingCount,
  isActive,
  go,
  menuOpen,
  onClose,
  theme,
  onToggleTheme,
  onLogout,
  dashboardPath,
}) {
  return (
    <>
      {menuOpen ? <button className="sidebar-backdrop" aria-label="Close navigation" onClick={onClose} /> : null}
      <aside className={`sidebar ${menuOpen ? 'is-open' : ''}`.trim()} aria-label="Main navigation">
        <button className="brand" onClick={() => go(dashboardPath)}>
          <span className="brand-mark">C</span>
          <span>
            Campus<span className="brand-light"> Connect</span>
            <small>STUDENT COMMUNITY</small>
          </span>
        </button>
        <span className="sidebar-section-label">{admin ? 'Administration' : 'Student space'}</span>
        <nav className="topnav side-nav">
          {navItems.map(([to, label, icon]) => (
            <button
              key={to}
              onClick={() => go(to)}
              className={`nav-link ${isActive(to) ? 'selected' : ''}`.trim()}
              aria-current={isActive(to) ? 'page' : undefined}
            >
              <Glyph name={icon} size={17} />
              <span className="nav-text">{label}</span>
              {to === '/admin/approvals' && pendingCount > 0 ? (
                <span className="nav-count" aria-label={`${pendingCount} submissions waiting`}>{pendingCount}</span>
              ) : null}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-account">
          <span className="avatar" aria-hidden="true">{initials(user.name)}</span>
          <div className="profile-meta">
            <b>{user.name}</b>
            <span>{admin ? 'Community admin' : 'Student volunteer'}</span>
          </div>
        </div>
        <div className="sidebar-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button title="Sign out" aria-label="Sign out" className="icon-button logout" onClick={onLogout}>
            <Glyph name="logout" size={17} />
          </button>
        </div>
      </aside>
    </>
  );
}
