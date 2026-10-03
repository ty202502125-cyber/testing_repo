import { useActivityIndex, useAdminQueue, useStudentService, useUpcomingActivities } from '../../hooks/useCampusData';
import { availability, availabilityNote, eventSchedule, hoursLabel, shortTitle, timeRange } from '../../utils/format';
import ActivityList from '../../components/ActivityList';
import { EmptyState, QuietLink } from '../../components/ui';
import { InfoRow, QueueFoot, ReviewHead, ReviewRow, SectionHead, SummaryBand, TaskCallout } from '../../components/workspace';
import shared from '../shared.module.css';

function AdminActivityList({ items, go }) {
  if (!items.length) return <EmptyState message="No open activities are scheduled." />;
  return (
    <div className={shared.block}>
      {items.map((item) => (
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
  );
}

function StudentOverview({ user, go }) {
  const { approvedCount, approvedHours, pendingCount, pendingHours } = useStudentService(user);
  const upcoming = useUpcomingActivities();
  const primary = upcoming[0];
  const rest = upcoming.slice(1, 5);
  const firstName = user.name.split(' ')[0];

  return (
    <div className={`content-wrap ${shared.wrap}`}>
      <header className={shared.intro}>
        <div>
          <h1 className={shared.title}>Good morning, {firstName}.</h1>
          <p className={shared.text}>Here is the next activity with places still available.</p>
        </div>
        <QuietLink onClick={() => go('/activities')}>Browse activities</QuietLink>
      </header>

      {primary ? (
        <TaskCallout
          label="Next open opportunity"
          category={`${primary.category.toUpperCase()} · ${primary.organizer.toUpperCase()}`}
          title={primary.title}
          description={primary.description}
          date={primary.date}
          facts={[
            { icon: 'clock', text: timeRange(primary.startTime, primary.endTime) },
            { icon: 'pin', text: primary.location },
            { icon: 'users', text: `${primary.spotsAvailable} of ${primary.capacity} places available` },
          ]}
          avail={availability(primary)}
          actionLabel={`View ${shortTitle(primary.title)}`}
          onOpen={() => go(`/activities/${primary.id}`)}
        />
      ) : (
        <EmptyState message="No open opportunities are scheduled right now. Check back after the next event is published." />
      )}

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

      <section className={shared.section}>
        <SectionHead
          title="Coming up on campus"
          action={<QuietLink onClick={() => go('/activities')}>All opportunities</QuietLink>}
        />
        <ActivityList
          items={rest}
          mode="rows"
          go={go}
          empty={<EmptyState message="New opportunities will appear here as they are published." />}
        />
      </section>
    </div>
  );
}

function AdminOverview({ focus, notify, go }) {
  const queue = useAdminQueue(notify);
  const index = useActivityIndex();
  const upcoming = useUpcomingActivities(5);
  const approvalsOnly = focus === 'approvals';

  return (
    <div className={`content-wrap ${shared.wrap}`}>
      <header className={shared.intro}>
        <div>
          <h1 className={shared.title}>
            {approvalsOnly ? 'Review hour submissions.' : 'Hours waiting on you.'}
          </h1>
          <p className={shared.text}>
            {approvalsOnly
              ? 'Check the student, activity and claimed hours before deciding.'
              : 'Clear the review queue, then keep the upcoming dates accurate.'}
          </p>
        </div>
        <div className={shared.queueCount}>
          <b>{queue.pending.length}</b>
          pending submissions
        </div>
      </header>

      {!approvalsOnly && (
        <SummaryBand
          items={[
            { value: upcoming.length, label: 'Open activities', note: 'Accepting sign-ups' },
            { value: queue.studentCount, label: 'Participating students', note: 'Across all recorded activities' },
            { value: hoursLabel(queue.approvedHours), label: 'Approved hours', note: 'Volunteer time on record' },
          ]}
        />
      )}

      <section className={shared.section} aria-label="Pending hour submissions">
        <SectionHead title="Pending hour submissions" meta={`${queue.pending.length} to review`} />
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
                  eventMeta={event ? eventSchedule(event) : 'Activity no longer listed'}
                  recordDate={record.date}
                  busy={queue.busyId === record.id}
                  onApprove={() => queue.decide(record, 'approved')}
                  onDecline={() => queue.decide(record, 'rejected')}
                />
              );
            })}
            <QueueFoot>Review the activity and hours before approving a submission.</QueueFoot>
          </>
        ) : (
          <EmptyState message="All caught up. New student submissions will appear here." />
        )}
      </section>

      {!approvalsOnly && (
        <section className={shared.section}>
          <SectionHead
            title="Upcoming activities"
            action={<QuietLink onClick={() => go('/admin/activities')}>Manage activities</QuietLink>}
          />
          <AdminActivityList items={upcoming} go={go} />
          <div className={shared.links}>
            <QuietLink onClick={() => go('/admin/certificates')}>Issue certificates</QuietLink>
            <QuietLink onClick={() => go('/admin/templates')}>Certificate templates</QuietLink>
          </div>
        </section>
      )}
    </div>
  );
}

export default {
  id: 'nextActionDesk',
  name: 'Next-action desk',
  shortName: 'Task first',
  summary: 'Puts the next useful task first for each role.',
  feedMode: 'rows',
  StudentOverview,
  AdminOverview,
};
