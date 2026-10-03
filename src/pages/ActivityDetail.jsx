import { useState } from 'react';
import Glyph from '../components/Glyph';
import { Button, EmptyState } from '../components/ui';
import { availability, dateLabel, timeRange, weekdayLong } from '../utils/format';
import { participationService, store } from '../services/api';

/** Detail view: schedule, place and the sign-up decision in one scan path. */
export default function ActivityDetail({ id, go, notify, user, refresh }) {
  const activity = store.read('campus_activities', []).find((item) => item.id === id);
  const registered = store.read('campus_signups', []).some((entry) => entry.activityId === id && entry.studentId === user.id);
  const [busy, setBusy] = useState(false);

  if (!activity) {
    return (
      <div className="content-wrap">
        <EmptyState message="We could not find that activity. It may have been removed." />
        <Button onClick={() => go('/activities')}>Back to activities</Button>
      </div>
    );
  }

  const state = availability(activity);
  const full = Number(activity.spotsAvailable) < 1;
  const cancelled = activity.status === 'cancelled';

  async function signup() {
    setBusy(true);
    try {
      await participationService.signUp(id, user);
      notify("You're on the list. See you there.");
      refresh();
    } catch (err) {
      notify(err.message);
    } finally {
      setBusy(false);
    }
  }

  const primaryLabel = cancelled
    ? 'Event cancelled'
    : registered
      ? "You're registered"
      : full
        ? 'No places left'
        : busy
          ? 'Saving your place…'
          : `Sign up for ${activity.title}`;

  return (
    <div className="content-wrap detail-wrap">
      <button className="back-link" onClick={() => go('/activities')}>← All activities</button>
      <div className="detail-hero">
        {activity.campaignImage ? (
          <img className="detail-campaign-image" src={activity.campaignImage} alt={`${activity.title} campaign`} />
        ) : null}
        <span className={`badge ${cancelled ? 'red' : 'green'}`}>{cancelled ? 'Cancelled' : activity.category}</span>
        <h1>{activity.title}</h1>
        <p>{activity.description}</p>
        {cancelled ? (
          <p className="cancelled-message">
            This event has been cancelled.{activity.cancellationReason ? ` Reason: ${activity.cancellationReason}` : ''}
          </p>
        ) : null}
        <div className="detail-organizer">Organized by <b>{activity.organizer}</b></div>
      </div>
      <div className="detail-layout">
        <div>
          <div className="detail-info-grid">
            <div className="detail-info">
              <span className="detail-info-icon"><Glyph name="calendar" size={15} /></span>
              <div><small>DATE</small><b>{weekdayLong(activity.date)}, {dateLabel(activity.date)}</b></div>
            </div>
            <div className="detail-info">
              <span className="detail-info-icon"><Glyph name="clock" size={15} /></span>
              <div><small>TIME</small><b>{timeRange(activity.startTime, activity.endTime)}</b></div>
            </div>
            <div className="detail-info">
              <span className="detail-info-icon"><Glyph name="pin" size={15} /></span>
              <div><small>LOCATION</small><b>{activity.location}</b></div>
            </div>
            <div className="detail-info">
              <span className="detail-info-icon"><Glyph name="users" size={15} /></span>
              <div><small>PLACES</small><b>{activity.spotsAvailable} of {activity.capacity} available</b></div>
            </div>
          </div>
          <div className="what-to-know">
            <h2>Good to know</h2>
            <p>
              Come as you are. Your organizer shares the meeting point and any kit you need once you sign up.
              Bring a reusable water bottle and comfortable shoes.
            </p>
          </div>
        </div>
        <aside className="signup-card">
          <h3>Reserve your place</h3>
          <p>{cancelled ? 'This event is no longer accepting sign-ups.' : `Status: ${state.label}.`}</p>
          <div className="spots-meter">
            <span><b>{activity.spotsAvailable}</b> of {activity.capacity} places remaining</span>
            <div><i style={{ width: `${Math.max(4, (Number(activity.spotsAvailable) / Number(activity.capacity)) * 100)}%` }} /></div>
          </div>
          <Button disabled={cancelled || registered || full || busy} onClick={signup}>{primaryLabel}</Button>
          <small>
            {registered
              ? 'You are registered. Contact the organizer if your plans change.'
              : 'By signing up you agree to attend or let the organizer know.'}
          </small>
        </aside>
      </div>
    </div>
  );
}
