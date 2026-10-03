import { useActivityIndex, useAdminQueue, useStudentService, useUpcomingActivities } from '../../hooks/useCampusData';
import { availability, eventSchedule, hoursLabel } from '../../utils/format';
import ActivityList from '../../components/ActivityList';
import { EmptyState, QuietLink } from '../../components/ui';
import { AgendaList, AgendaRow, QueueFoot, RecordSummary, ReviewRow, RowActions, SectionHead } from '../../components/workspace';
import shared from '../shared.module.css';

function StudentOverview({ user, go }) {
  const { approvedHours, pendingCount, pendingHours } = useStudentService(user);
  const upcoming = useUpcomingActivities();
  const firstName = user.name.split(' ')[0];

  return (
    <div className={`content-wrap ${shared.wrap}`}>
      <header className={shared.intro}>
        <div>
          <h1 className={shared.title}>Good morning, {firstName}.</h1>
          <p className={shared.text}>Choose an activity that fits your week. Dates and places are listed as published.</p>
        </div>
        <QuietLink onClick={() => go('/activities')}>Browse activities</QuietLink>
      </header>

      <div className={shared.split}>
        <section className={shared.section}>
          <SectionHead title="Upcoming activities" meta="Next dates" />
          <ActivityList
            items={upcoming}
            mode="agenda"
            go={go}
            empty={<EmptyState message="No open activities are scheduled. New dates will appear here." />}
          />
        </section>

        <RecordSummary
          approved={hoursLabel(approvedHours)}
          approvedLabel="Approved hours"
          note="Only approved contributions are counted."
          pendingLabel={pendingCount === 0 ? 'No submissions waiting' : `${pendingCount} ${pendingCount === 1 ? 'submission' : 'submissions'} awaiting review`}
          pendingNote={pendingCount ? `${hoursLabel(pendingHours)} submitted by you` : 'Submit hours after an activity you attended.'}
          action={<QuietLink onClick={() => go('/records')}>My service record</QuietLink>}
        />
      </div>
    </div>
  );
}

function AdminOverview({ focus, notify, go }) {
  const queue = useAdminQueue(notify);
  const index = useActivityIndex();
  const upcoming = useUpcomingActivities();
  const approvalsOnly = focus === 'approvals';

  return (
    <div className={`content-wrap ${shared.wrap}`}>
      <header className={shared.intro}>
        <div>
          <h1 className={shared.title}>
            {approvalsOnly ? 'Review hour submissions.' : 'This week on campus.'}
          </h1>
          <p className={shared.text}>
            {approvalsOnly
              ? 'Review student submissions and keep the community record accurate.'
              : 'Upcoming dates on the left, the review queue on the right.'}
          </p>
        </div>
        <QuietLink onClick={() => go('/admin/activities')}>Manage activities</QuietLink>
      </header>

      <div className={shared.splitEven}>
        <section className={shared.section} aria-label="Upcoming activities">
          <SectionHead title="Upcoming activities" meta={`${upcoming.length} scheduled`} />
          {upcoming.length ? (
            <AgendaList>
              {upcoming.map((item) => (
                <AgendaRow
                  key={item.id}
                  item={item}
                  schedule={eventSchedule(item)}
                  avail={availability(item)}
                  controls={<RowActions actions={[{ label: 'Edit activity', onClick: () => go('/admin/activities') }]} />}
                />
              ))}
            </AgendaList>
          ) : (
            <EmptyState message="No open activities are scheduled." />
          )}
        </section>

        <aside className={shared.queue} aria-label="Pending hour submissions">
          <div className={shared.queueHead}>
            <h3>Hours awaiting approval</h3>
            <span className={shared.queueCount}>
              <b>{queue.pending.length}</b>
              {queue.pending.length === 1 ? 'submission' : 'submissions'}
            </span>
          </div>
          {queue.pending.length ? (
            <>
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
            <EmptyState message="All caught up. New submissions will appear here." />
          )}
        </aside>
      </div>
    </div>
  );
}

export default {
  id: 'campusWeek',
  name: 'Campus week',
  shortName: 'Agenda',
  summary: 'Organises activities and reviews by date.',
  feedMode: 'agenda',
  StudentOverview,
  AdminOverview,
};
