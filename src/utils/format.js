/**
 * Shared formatting + state helpers for Campus Connect.
 *
 * These keep dates, times and status wording consistent across every screen and
 * layout variant, so the same record never reads differently in two places.
 */

export function parseDate(date) {
  return new Date(`${date}T12:00:00`);
}

export function dateLabel(date) {
  return parseDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function dateShort(date) {
  return parseDate(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function weekdayLong(date) {
  return parseDate(date).toLocaleDateString('en-US', { weekday: 'long' });
}

export function weekdayShort(date) {
  return parseDate(date).toLocaleDateString('en-US', { weekday: 'short' });
}

export function monthDay(date) {
  return parseDate(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
}

export function dayNumber(date) {
  return parseDate(date).toLocaleDateString('en-US', { day: '2-digit' });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function toParts(time) {
  const [hours, minutes] = String(time || '').split(':').map(Number);
  if (!Number.isFinite(hours)) return null;
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return { hour, minute: String(minutes || 0).padStart(2, '0'), suffix };
}

export function formatTime(time) {
  const parts = toParts(time);
  return parts ? `${parts.hour}:${parts.minute} ${parts.suffix}` : '';
}

/** `7:30–11:30 AM` when both times share a suffix, otherwise `11:30 AM–1:00 PM`. */
export function timeRange(start, end) {
  const from = toParts(start);
  const to = toParts(end);
  if (!from || !to) return '';
  const head = `${from.hour}:${from.minute}`;
  const tail = `${to.hour}:${to.minute}`;
  return from.suffix === to.suffix ? `${head}–${tail} ${to.suffix}` : `${head} ${from.suffix}–${tail} ${to.suffix}`;
}

/** A single combined line: `7:30–11:30 AM · Baywalk Entrance, Manila`. */
export function eventSchedule(item) {
  const range = timeRange(item.startTime, item.endTime);
  return range ? `${range} · ${item.location}` : item.location;
}

/**
 * Real, honest availability wording. A full activity is "Full" — never "Open" —
 * even while its status field still says open.
 */
export function availability(item) {
  const spots = Number(item.spotsAvailable ?? 0);
  if (item.status === 'cancelled') return { label: 'Cancelled', tone: 'danger' };
  if (item.status === 'completed') return { label: 'Completed', tone: 'neutral' };
  if (spots < 1) return { label: 'Full', tone: 'warning' };
  return { label: `${spots} ${spots === 1 ? 'place' : 'places'} left`, tone: 'success' };
}

export function availabilityNote(item) {
  const spots = Number(item.spotsAvailable ?? 0);
  if (item.status === 'cancelled') return 'Cancelled';
  if (item.status === 'completed') return 'Completed';
  if (spots < 1) return 'Full · no places left';
  return `${spots} places left`;
}

export const statusTone = {
  approved: 'success',
  pending: 'warning',
  registered: 'info',
  rejected: 'danger',
  open: 'success',
  ongoing: 'info',
  completed: 'neutral',
  cancelled: 'danger',
};

export function recordTone(status) {
  return statusTone[status] || 'neutral';
}

export function recordLabel(status) {
  return status === 'registered' ? 'Registered' : status.charAt(0).toUpperCase() + status.slice(1);
}

export function hoursLabel(value) {
  const number = Number(value || 0);
  return `${number.toFixed(number % 1 ? 1 : 0)} hrs`;
}

/** Action label names the destination, so six rows never read "View details". */
export function activityActionLabel(item) {
  const short = String(item.title || '').split(' ').slice(0, 2).join(' ');
  return `View ${short}`;
}

export function shortTitle(title) {
  return String(title || '').split(' ').slice(0, 2).join(' ');
}
