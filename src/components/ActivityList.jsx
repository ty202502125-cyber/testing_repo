import { availabilityNote, availability, eventSchedule, activityActionLabel } from '../utils/format';
import { AgendaRow, InfoRow, AgendaList, InfoList } from './workspace';

/**
 * Shared activity list. The layout choice only changes the presentation —
 * agenda for schedule-led work, compact rows for everything else — so every
 * variant reads the same data and shows the same honest availability.
 */
export default function ActivityList({ items, mode = 'rows', go, empty }) {
  if (!items.length) return empty;
  const open = (item) => go(`/activities/${item.id}`);
  if (mode === 'agenda') {
    return (
      <AgendaList>
        {items.map((item) => (
          <AgendaRow
            key={item.id}
            item={item}
            schedule={eventSchedule(item)}
            avail={availability(item)}
            onOpen={() => open(item)}
            actionLabel={activityActionLabel(item)}
          />
        ))}
      </AgendaList>
    );
  }
  return (
    <InfoList>
      {items.map((item) => (
        <InfoRow
          key={item.id}
          title={item.title}
          meta={`${eventSchedule(item)} · ${item.category}`}
          chip={availabilityNote(item)}
          chipTone={availability(item).tone}
          onOpen={() => open(item)}
          actionLabel={activityActionLabel(item)}
        />
      ))}
    </InfoList>
  );
}
