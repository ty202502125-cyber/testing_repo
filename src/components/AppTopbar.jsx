import Glyph from './Glyph';
import LayoutSwitcher from './LayoutSwitcher';
import { initials } from '../utils/format';

/**
 * The bar carries two real things: where you are and which workspace layout is
 * active. It no longer claims a live system status it cannot verify.
 */
export default function AppTopbar({ admin, pageLabel, user, menuOpen, onToggleMenu }) {
  return (
    <header className="topbar">
      <div className="topbar-leading">
        <button
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          className="icon-button hamburger"
          onClick={onToggleMenu}
        >
          <Glyph name={menuOpen ? 'close' : 'menu'} size={17} />
        </button>
        <div className="topbar-crumb">
          <span>{admin ? 'Administration' : 'Student space'}</span>
          <b>{pageLabel}</b>
        </div>
      </div>
      <LayoutSwitcher />
      <span className="topbar-user">
        <span className="avatar small-avatar" aria-hidden="true">{initials(user.name)}</span>
        <span className="topbar-user-name">{user.name}</span>
      </span>
    </header>
  );
}
