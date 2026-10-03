import { layoutOptions, layoutIds } from '../layouts/registry';
import { useLayout } from '../context/layoutHooks';

/**
 * The three design directions ship in the product as selectable workspace
 * layouts. Students and admins pick the one that suits how they work.
 */
export default function LayoutSwitcher({ compact = false }) {
  const { layoutId, setLayout } = useLayout();
  const handleKeyDown = (event) => {
    const index = layoutIds.indexOf(layoutId);
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault();
      setLayout(layoutIds[(index + 1) % layoutIds.length]);
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault();
      setLayout(layoutIds[(index - 1 + layoutIds.length) % layoutIds.length]);
    }
  };
  return (
    <div className={`layout-switcher ${compact ? 'is-compact' : ''}`.trim()} role="radiogroup" aria-label="Workspace layout" onKeyDown={handleKeyDown}>
      <span className="layout-switcher-label">Layout</span>
      <div className="layout-switcher-options">
        {layoutOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={layoutId === option.id}
            className={layoutId === option.id ? 'is-active' : ''}
            title={option.summary}
            onClick={() => setLayout(option.id)}
          >
            {option.shortName}
          </button>
        ))}
      </div>
    </div>
  );
}
