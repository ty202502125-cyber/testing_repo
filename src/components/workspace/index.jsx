import Glyph from '../Glyph';
import { initials, monthDay, weekdayShort, dateLabel, recordLabel, recordTone } from '../../utils/format';
import styles from './workspace.module.css';

const toneClass = {
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  info: styles.toneInfo,
  danger: styles.toneDanger,
  neutral: styles.toneNeutral,
};

export function SectionHead({ title, meta, action }) {
  return (
    <div className={styles.head}>
      <h3>{title}</h3>
      {action || (meta ? <span className={styles.meta}>{meta}</span> : null)}
    </div>
  );
}

export function QuietLink({ children, onClick }) {
  return (
    <button type="button" className="quiet-link" onClick={onClick}>
      {children}
      <Glyph name="arrow" size={13} />
    </button>
  );
}

function availabilityClass(tone) {
  if (tone === 'warning') return styles.availFull;
  if (tone === 'danger') return styles.availDanger;
  if (tone === 'neutral') return styles.availNeutral;
  return '';
}

/** A date-led row: the date is the organising structure, not decoration. */
export function AgendaRow({ item, schedule, avail, onOpen, actionLabel, controls }) {
  return (
    <article className={styles.agendaRow}>
      <div className={styles.dateCell}>
        <div className={styles.weekday}>{weekdayShort(item.date).toUpperCase()}</div>
        <div className={styles.dateNum}>{monthDay(item.date)}</div>
      </div>
      <div className={styles.event}>
        <div className={styles.eventTop}>
          <h4 className={styles.eventName}>{item.title}</h4>
          <span className={styles.category}>{item.category}</span>
        </div>
        <div className={styles.eventMeta}>{schedule}</div>
        <div className={styles.eventBottom}>
          <span className={`${styles.avail} ${availabilityClass(avail.tone)}`}>{avail.label}</span>
          {controls || (onOpen ? (
            <button type="button" className={styles.control} onClick={onOpen}>{actionLabel}</button>
          ) : null)}
        </div>
      </div>
    </article>
  );
}

export function AgendaList({ children }) {
  return <div className={styles.list}>{children}</div>;
}

/** Row-level controls stay in the row's own visual language. */
export function RowActions({ actions, danger = false }) {
  return (
    <span className={styles.controls}>
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          className={danger ? `${styles.control} ${styles.controlDanger}` : styles.control}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      ))}
    </span>
  );
}

/** Compact row used where the list is a working queue rather than a schedule. */
export function InfoRow({ title, meta, chip, chipTone, onOpen, actionLabel }) {
  const chipStyle = chipTone === 'warning' ? `${styles.chip} ${styles.chipFull}` : chipTone === 'neutral' ? `${styles.chip} ${styles.chipNeutral}` : styles.chip;
  return (
    <div className={styles.infoRow}>
      <div className={styles.infoCopy}>
        <p className={styles.infoTitle}>{title}</p>
        <p className={styles.infoMeta}>{meta}</p>
      </div>
      <div className={styles.infoTrailing}>
        {chip ? <span className={chipStyle}>{chip}</span> : null}
        {onOpen ? <button type="button" className={styles.control} onClick={onOpen}>{actionLabel}</button> : null}
      </div>
    </div>
  );
}

export function InfoList({ children }) {
  return <div className={styles.list}>{children}</div>;
}

/** One contribution: record date, hours and the state the record is really in. */
export function LedgerRow({ title, meta, value, status }) {
  const tone = recordTone(status);
  return (
    <div className={styles.ledgerRow}>
      <div>
        <p className={styles.infoTitle}>{title}</p>
        <p className={styles.infoMeta}>{meta}</p>
      </div>
      <span className={styles.ledgerValue}>{value}</span>
      <span className={`${styles.ledgerStatus} ${toneClass[tone]}`}>
        <span className={styles.ledgerDot} aria-hidden="true" />
        {recordLabel(status)}
      </span>
    </div>
  );
}

export function LedgerList({ children }) {
  return <div className={styles.list}>{children}</div>;
}

export function SummaryBand({ items }) {
  return (
    <div className={styles.summary}>
      {items.map((entry) => (
        <div className={styles.summaryItem} key={entry.label}>
          <div className={entry.pending ? `${styles.summaryValue} ${styles.summaryValuePending}` : styles.summaryValue}>
            {entry.value}
          </div>
          <div className={styles.summaryLabel}>{entry.label}</div>
          {entry.note ? <div className={styles.summaryNote}>{entry.note}</div> : null}
        </div>
      ))}
    </div>
  );
}

export function RecordSummary({ approved, approvedLabel, note, pendingLabel, pendingNote, action }) {
  return (
    <aside className={styles.record}>
      <div className={styles.recordValue}>{approved}</div>
      <div className={styles.recordLabel}>{approvedLabel}</div>
      {note ? <div className={styles.recordNote}>{note}</div> : null}
      <div className={styles.recordDivider} />
      <div className={styles.recordPendingValue}>{pendingLabel}</div>
      {pendingNote ? <div className={styles.recordNote}>{pendingNote}</div> : null}
      {action ? <div className={styles.recordAction}>{action}</div> : null}
    </aside>
  );
}

export function TaskCallout({ label, category, title, description, date, facts, avail, actionLabel, onOpen }) {
  return (
    <section className={styles.task} aria-label={label}>
      <div className={styles.taskLabel}>{label}</div>
      <div className={styles.taskMain}>
        <div>
          <div className={styles.category}>{category}</div>
          <h3 className={styles.taskTitle}>{title}</h3>
          <p className={styles.taskDescription}>{description}</p>
        </div>
        <div className={styles.dateStamp}>
          <small>{weekdayShort(date).toUpperCase()}</small>
          <b>{monthDay(date).split(' ')[1]}</b>
        </div>
      </div>
      <div className={styles.facts}>
        {facts.map((fact) => (
          <span className={styles.fact} key={fact.text}>
            <Glyph name={fact.icon} size={14} />
            {fact.text}
          </span>
        ))}
      </div>
      <div className={styles.eventBottom}>
        <span className={`${styles.avail} ${availabilityClass(avail.tone)}`}>{avail.label}</span>
        <button type="button" className={styles.taskAction} onClick={onOpen}>{actionLabel}</button>
      </div>
    </section>
  );
}

export function ReviewHead() {
  return (
    <div className={styles.reviewHead} role="row">
      <span>Student · activity</span>
      <span>Claimed</span>
      <span>Decision</span>
    </div>
  );
}

export function ReviewRow({ name, studentId, hours, activity, eventMeta, recordDate, onApprove, onDecline, busy }) {
  return (
    <article className={styles.reviewRow}>
      <div className={styles.reviewTop}>
        <div className={styles.identity}>
          <span className="avatar" aria-hidden="true">{initials(name)}</span>
          <span>
            <span className={styles.name}>{name}</span>
            <span className={styles.studentId}>{studentId}</span>
          </span>
        </div>
        <div className={styles.hours}>
          {hours}<small>hrs</small>
        </div>
      </div>
      <div className={styles.reviewDetail}>
        <strong>{activity}</strong>
        <small>{eventMeta}</small>
        {recordDate ? <small>Date on record · {dateLabel(recordDate)}</small> : null}
      </div>
      <div className={styles.reviewActions}>
        <button type="button" className={styles.approve} onClick={onApprove} disabled={busy}>
          <Glyph name="check" size={13} />
          Approve
        </button>
        <button type="button" className={styles.decline} onClick={onDecline} disabled={busy}>
          <Glyph name="x" size={13} />
          Decline
        </button>
      </div>
    </article>
  );
}

export function QueueFoot({ children }) {
  return <p className={styles.queueFoot}>{children}</p>;
}
