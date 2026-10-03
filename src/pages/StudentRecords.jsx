import { useState } from 'react';
import { Button, Badge, EmptyState, PageIntro, SectionHead } from '../components/ui';
import { GrantedCertificate } from '../components/certificates';
import { SummaryBand } from '../components/workspace';
import { dateLabel, hoursLabel, recordLabel, recordTone } from '../utils/format';
import { certificateService, participationService, store } from '../services/api';

/**
 * The student's service record: a reliable account of contribution states.
 * Approved hours are counted separately from claims still under review, and no
 * decorative chart stands in for data we do not have.
 */
export default function StudentRecords({ user, notify }) {
  const [certificates] = useState(() => certificateService.getForUser(user.id));
  const [records, setRecords] = useState(() => participationService.getRecordsForUser(user));
  const [submitting, setSubmitting] = useState(false);

  const approved = records.filter((record) => record.status === 'approved');
  const pending = records.filter((record) => record.status === 'pending');
  const approvedHours = approved.reduce((total, record) => total + Number(record.hoursLogged || 0), 0);
  const pendingHours = pending.reduce((total, record) => total + Number(record.hoursLogged || 0), 0);

  const activities = store.read('campus_activities', []);
  const eligible = records
    .filter((record) => ['registered', 'rejected'].includes(record.status))
    .map((record) => activities.find((activity) => activity.id === record.activityId))
    .filter(Boolean);
  const completed = activities.filter(
    (activity) => activity.status === 'completed' && !records.some((record) => record.activityId === activity.id),
  );
  const loggable = [...new Map([...eligible, ...completed].map((activity) => [activity.id, activity])).values()];

  async function logHours(event) {
    event.preventDefault();
    const form = event.currentTarget;
    setSubmitting(true);
    const data = Object.fromEntries(new FormData(form));
    try {
      const record = await participationService.logHours(data.activityId, data.hours, user);
      setRecords((current) => [record, ...current.filter((entry) => entry.activityId !== record.activityId)]);
      form.reset();
      notify('Hours submitted for admin approval.');
    } catch (error) {
      notify(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="content-wrap">
      <PageIntro
        title="Service record"
        text="Activities you join are added here automatically. Submit your hours after attending for admin review."
      />

      <SummaryBand
        items={[
          { value: hoursLabel(approvedHours), label: 'Approved hours', note: `Across ${approved.length} approved ${approved.length === 1 ? 'contribution' : 'contributions'}` },
          { value: pending.length, label: pending.length === 1 ? 'Submission awaiting review' : 'Submissions awaiting review', pending: true, note: `${hoursLabel(pendingHours)} submitted` },
        ]}
      />

      <section className="records-panel log-hours-panel">
        <div>
          <h2>Submit event hours</h2>
          <p>Choose an activity you attended, enter your hours, and an admin will review them.</p>
        </div>
        <form className="hours-form" onSubmit={logHours}>
          <label>
            Activity
            <select name="activityId" required defaultValue="">
              <option value="" disabled>Select an activity</option>
              {loggable.map((activity) => (
                <option key={activity.id} value={activity.id}>{activity.title}</option>
              ))}
            </select>
          </label>
          <label>
            Hours
            <input name="hours" type="number" min="0.5" max="24" step="0.5" placeholder="e.g. 3" required />
          </label>
          <Button disabled={!loggable.length || submitting}>{submitting ? 'Submitting…' : 'Submit hours'}</Button>
        </form>
        {!loggable.length ? (
          <small className="no-completed">
            Join an activity first. It will appear here so you can submit your hours after attending.
          </small>
        ) : null}
      </section>

      <section className="records-panel">
        <SectionHead title="Activity history" meta={`${records.length} ${records.length === 1 ? 'record' : 'records'}`} />
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Activity</th>
                <th scope="col">Date on record</th>
                <th scope="col">Hours</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  <td><b>{record.activityTitle}</b></td>
                  <td>{dateLabel(record.date)}</td>
                  <td><b>{record.hoursLogged ? hoursLabel(record.hoursLogged) : 'Not submitted'}</b></td>
                  <td><Badge tone={recordTone(record.status)}>{recordLabel(record.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!records.length ? <EmptyState message="Join an activity to start building your service record." /> : null}
        </div>
      </section>

      <section className="records-panel certificates-section">
        <SectionHead title="My certificates" meta={`${certificates.length} ${certificates.length === 1 ? 'certificate' : 'certificates'}`} />
        {certificates.length ? (
          <div className="granted-certificate-list">
            {certificates.map((certificate) => <GrantedCertificate key={certificate.id} certificate={certificate} />)}
          </div>
        ) : (
          <EmptyState message="Your certificates appear here once an administrator grants one." />
        )}
      </section>
    </div>
  );
}
