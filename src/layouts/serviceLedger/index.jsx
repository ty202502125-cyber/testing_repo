import { useActivityIndex, useAdminQueue, useStudentService, useUpcomingActivities } from '../../hooks/useCampusData';
import { availability, availabilityNote, dateLabel, eventSchedule, hoursLabel } from '../../utils/format';
import ActivityList from '../../components/ActivityList';
import { EmptyState, QuietLink } from '../../components/ui';
import { InfoRow, LedgerList, LedgerRow, QueueFoot, ReviewHead, ReviewRow, SectionHead, SummaryBand } from '../../components/workspace';
import shared from '../shared.module.css';

function StudentOverview({ user, go }) {
  const { records, approvedCount, approvedHours, pendingCount, pendingHours } = useStudentService(user);
  const upcoming = useUpcomingActivities(4);
  const firstName = user.name.split(' ')[0];

  return (
    <div className={`content-wrap ${shared.wrap}`}>
      <header className={shared.intro}>
        <div>
          <h1 className={shared.title}>Good morning, {firstName}.</h1>
          <p className={shared.text}>Your hours, in one place — what has been approved, what is waiting, and what you can still join.</p>
        </div>
        <QuietLink onClick={() => go('/records')}>My service record</QuietLink>
      </header>

      <SummaryBand
        items={[
          {
            value: hoursLabel(approvedHours),
            label: 'Approved hours',
            note: `Across ${approvedCount} approved ${approvedCount === 1 ? 'contribution' : 'contributions'}`,
          },
          {
            value: pendingCount,
            label: pendingCount === 1 ? 'Submission awaiting review' : 'Submissions awaiting review',
            pending: true,
            note: `${hoursLabel(pendingHours)} submitted`,
          },
        ]}
      />

      <section className={shared.section} aria-label="Service record">
        <SectionHead
          title="Service record"
          action={<QuietLink onClick={() => go('/records')}>View full record</QuietLink>}
        />
        {records.length ? (
          <LedgerList>
            {records.map((record) => (
              <LedgerRow
                key={record.id}
                title={record.activityTitle}
                meta={`${dateLabel(record.date)} · date on record`}
                value={record.hoursLogged ? hoursLabel(record.hoursLogged) : 'Not submitted'}
                status={record.status}
              />
            ))}
          </LedgerList>
        ) : (
          <EmptyState message="Join an activity to start building your service record." />
        )}
      </section>

      <section className={shared.section} aria-label="Upcoming activities">
        <SectionHead
          title="Upcoming activities"
          action={<QuietLink onClick={() => go('/activities')}>Browse activities</QuietLink>}
        />
        <ActivityList
          items={upcoming}
          mode="rows"
          go={go}
          empty={<EmptyState message="No open activities are scheduled." />}
        />
      </section>
    </div>
  );
}

function AdminOverview({ focus, notify, go }) {
  const queue = useAdminQueue(notify);
  const index = useActivityIndex();
  const upcoming = useUpcomingActivities(4);
  const approvalsOnly = focus === 'approvals';

  return (
    <div className={`content-wrap ${shared.wrap}`}>
      <header className={shared.intro}>
        <div>
          <h1 className={shared.title}>
            {approvalsOnly ? 'Review hour submissions.' : 'Records and reviews.'}
          </h1>
          <p className={shared.text}>
            {approvalsOnly
              ? "Check each student's submission against the activity record."
              : 'Approved hours stay separate from claims still awaiting a decision.'}
          </p>
        </div>
        <QuietLink onClick={() => go('/admin/activities')}>Manage activities</QuietLink>
      </header>

      <section className={shared.section} aria-label="Pending hour submissions">
        <SectionHead title={`${queue.pending.length} ${queue.pending.length === 1 ? 'submission' : 'submissions'} to review`} meta="Pending review" />
        {queue.pending.length ? (
          <>
            <ReviewHead />
            {queue.pending.map((record) => {
              const event = index.get(record.activityId);
              return (
                <ReviewRow
                  key={record.id}
                  name={record.studentName}
                  studentId={record.studentId}
                  hours={record.hoursLogged}
                  activity={record.activityTitle}
                  eventMeta={event ? `Event · ${eventSchedule(event)}` : 'Activity no longer listed'}
                  recordDate={record.date}
                  busy={queue.busyId === record.id}
                  onApprove={() => queue.decide(record, 'approved')}
                  onDecline={() => queue.decide(record, 'rejected')}
                />
              );
            })}
            <QueueFoot>Dates shown here are the dates listed on the service record.</QueueFoot>
          </>
        ) : (
          <EmptyState message="All caught up. New student submissions will appear here." />
        )}
      </section>

      <section className={shared.section} aria-label="Upcoming activities">
        <SectionHead title="Upcoming activities" meta={`${upcoming.length} scheduled`} />
        {upcoming.length ? (
          <div className={shared.block}>
            {upcoming.map((item) => (
              <InfoRow
                key={item.id}
                title={item.title}
                meta={eventSchedule(item)}
                chip={availabilityNote(item)}
                chipTone={availability(item).tone}
                onOpen={() => go('/admin/activities')}
                actionLabel="Edit activity"
              />
            ))}
          </div>
        ) : (
          <EmptyState message="No open activities are scheduled." />
        )}
        <div className={shared.links}>
          <QuietLink onClick={() => go('/admin/certificates')}>Issue certificates</QuietLink>
          <QuietLink onClick={() => go('/admin/templates')}>Certificate templates</QuietLink>
          <QuietLink onClick={() => go('/admin/approvals')}>All hour submissions</QuietLink>
        </div>
      </section>
    </div>
  );
}

export default {
  id: 'serviceLedger',
  name: 'Service ledger',
  shortName: 'Records',
  summary: 'Leads with accurate service-hour records.',
  feedMode: 'rows',
  StudentOverview,
  AdminOverview,
};
