import { useEffect, useState } from 'react';
import Glyph from '../components/Glyph';
import ActivityList from '../components/ActivityList';
import { EmptyState, PageIntro } from '../components/ui';
import { activityService } from '../services/api';

const CATEGORIES = ['Environment', 'Campus Care', 'Tutoring', 'Community'];

/**
 * Discovery stays schedule-led: activities are always sorted by date, never by storage order.
 */
export default function ActivityFeed({ go }) {
  const feedMode = 'agenda';
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All categories');
  const [status, setStatus] = useState('All statuses');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    activityService
      .getAll({ search, category, status })
      .then((data) => {
        if (!active) return;
        setError('');
        // Upcoming dates first (soonest first), then past activities (most recent first).
        const today = new Date().toISOString().slice(0, 10);
        setItems(
          [...data].sort((a, b) => {
            const aPast = a.date < today;
            const bPast = b.date < today;
            if (aPast !== bPast) return aPast ? 1 : -1;
            return aPast ? b.date.localeCompare(a.date) : a.date.localeCompare(b.date);
          }),
        );
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setLoading(false);
        setError('We could not load activities just now. Try again.');
      });
    return () => {
      active = false;
    };
  }, [search, category, status]);

  return (
    <div className="content-wrap">
      <PageIntro
        title="Find your kind of good."
        text="A few hours can change a day. Every activity below shows its real date, place and remaining places."
      />
      <div className="feed-tools">
        <label className="search-field">
          <Glyph name="search" size={16} />
          <span className="sr-only">Search activities</span>
          <input
            value={search}
            onChange={(event) => {
              setLoading(true);
              setSearch(event.target.value);
            }}
            placeholder="Search activities, places, causes…"
          />
        </label>
        <select aria-label="Filter by category" value={category} onChange={(event) => { setLoading(true); setCategory(event.target.value); }}>
          <option>All categories</option>
          {CATEGORIES.map((option) => <option key={option}>{option}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(event) => { setLoading(true); setStatus(event.target.value); }}>
          <option>All statuses</option>
          <option>Open</option>
          <option>Ongoing</option>
          <option>Completed</option>
        </select>
      </div>
      <div className="feed-result-line">
        <span>{loading ? 'Finding opportunities…' : `${items.length} ${items.length === 1 ? 'opportunity' : 'opportunities'}`}</span>
        <span>Upcoming first, then most recent</span>
      </div>
      {error ? <div className="form-error" role="alert">{error}</div> : null}
      {loading ? (
        <div className="skeleton-list">
          {[0, 1, 2].map((row) => <div className="skeleton-row" key={row} />)}
        </div>
      ) : (
        <ActivityList
          items={items}
          mode={feedMode}
          go={go}
          empty={<EmptyState message="No activities match this search. Try a different category or status." />}
        />
      )}
    </div>
  );
}
