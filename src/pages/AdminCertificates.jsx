import { useState } from 'react';
import { Button, EmptyState, PageIntro, SectionHead } from '../components/ui';
import { CertificateArtwork } from '../components/certificates';
import { dateLabel } from '../utils/format';
import { certificateService, certificateTemplateService, store } from '../services/api';

const todayISO = new Date().toISOString().slice(0, 10);

export default function AdminCertificates({ notify }) {
  const students = store.read('campus_users', []).filter((user) => user.role === 'student');
  const completedEvents = store.read('campus_activities', []).filter((event) => event.status === 'completed');
  const templates = certificateTemplateService.getAll();
  const [certificates, setCertificates] = useState(() => certificateService.getAll());
  const [busy, setBusy] = useState(false);
  const [userId, setUserId] = useState('');
  const [eventId, setEventId] = useState('');
  const [templateId, setTemplateId] = useState(templates[0]?.id || '');
  const [recipientName, setRecipientName] = useState('');
  const selectedTemplate = templates.find((template) => template.id === templateId) || templates[0];
  const [title, setTitle] = useState(selectedTemplate?.title || 'Certificate of Service');
  const [message, setMessage] = useState(selectedTemplate?.message || '');
  const [organization, setOrganization] = useState(selectedTemplate?.organization || '');
  const [signatory, setSignatory] = useState(selectedTemplate?.signatory || '');
  const [position, setPosition] = useState(selectedTemplate?.position || '');
  const selectedEvent = completedEvents.find((event) => event.id === eventId);

  const previewCertificate = selectedTemplate
    ? {
        recipientName: recipientName || 'Recipient name',
        eventName: selectedEvent?.title || 'Selected activity',
        eventDate: selectedEvent?.date || todayISO,
        hours: 0,
        certificateNumber: 'PREVIEW',
        issuedAt: `${todayISO}T12:00:00.000Z`,
        template: { ...selectedTemplate, title, message, organization, signatory, position },
      }
    : null;

  function chooseTemplate(nextTemplateId) {
    const nextTemplate = templates.find((template) => template.id === nextTemplateId);
    setTemplateId(nextTemplateId);
    setTitle(nextTemplate?.title || '');
    setMessage(nextTemplate?.overlayRecipientOnly ? '' : nextTemplate?.message || '');
    setOrganization(nextTemplate?.organization || '');
    setSignatory(nextTemplate?.signatory || '');
    setPosition(nextTemplate?.position || '');
  }

  async function grant(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setBusy(true);
    try {
      await certificateService.grant({
        userId: data.userId,
        eventId: data.eventId,
        templateId: data.templateId,
        recipientName: data.recipientName,
        title: data.title,
        message: data.message,
        organization: data.organization,
        signatory: data.signatory,
        position: data.position,
      });
      setCertificates(certificateService.getAll());
      form.reset();
      setUserId('');
      setEventId('');
      setRecipientName('');
      notify('Certificate granted. The student can now view and download it.');
    } catch (error) {
      notify(error.message || 'Could not grant this certificate.');
    } finally {
      setBusy(false);
    }
  }

  const ready = students.length && completedEvents.length && templates.length;

  return (
    <div className="content-wrap">
      <PageIntro
        title="Granted certificates"
        text="Grant an activity certificate to a student. It appears in their service record."
      />

      <section className="records-panel grant-certificate-panel">
        <div>
          <h2>Customize and grant</h2>
          <p>Start from a template, then edit the details for this recipient. The preview below is labelled as a preview.</p>
        </div>
        {ready ? (
          <form className="grant-certificate-form" onSubmit={grant}>
            <div className="grant-fields">
              <label>
                Student
                <select
                  name="userId"
                  required
                  value={userId}
                  onChange={(event) => {
                    setUserId(event.target.value);
                    const student = students.find((entry) => entry.id === event.target.value);
                    setRecipientName(student?.name || '');
                  }}
                >
                  <option value="" disabled>Select a student</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.email}</option>)}
                </select>
              </label>
              <label>
                Completed activity
                <select name="eventId" required value={eventId} onChange={(event) => setEventId(event.target.value)}>
                  <option value="" disabled>Select an activity</option>
                  {completedEvents.map((event) => <option key={event.id} value={event.id}>{event.title} · {dateLabel(event.date)}</option>)}
                </select>
              </label>
              <label>
                Certificate template
                <select name="templateId" required value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
              </label>
              <label>Recipient name<input name="recipientName" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} required /></label>
              <label>Certificate title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label>
              <label>Organization<input name="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} required /></label>
              <label className="grant-message-field">
                Certificate message / extra text
                <textarea name="message" rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Use {recipient}, {event}, {eventDate}, {hours}, {certificateNumber}, or {dateIssued}." />
              </label>
              <div className="form-row">
                <label>Signatory<input name="signatory" value={signatory} onChange={(event) => setSignatory(event.target.value)} required /></label>
                <label>Signatory position<input name="position" value={position} onChange={(event) => setPosition(event.target.value)} required /></label>
              </div>
            </div>
            {previewCertificate ? (
              <div className="grant-preview">
                <span className="preview-note">Preview — placeholder values shown until granted.</span>
                <CertificateArtwork certificate={previewCertificate} />
              </div>
            ) : null}
            <div className="grant-submit-row">
              <small>The saved certificate uses the details shown here and is linked to the selected student.</small>
              <Button disabled={busy}>{busy ? 'Granting…' : 'Grant certificate'}</Button>
            </div>
          </form>
        ) : (
          <EmptyState message="Add a student, a completed activity, and a certificate template before issuing a certificate." />
        )}
      </section>

      <section className="records-panel granted-admin-list">
        <SectionHead title="Issued certificates" meta={`${certificates.length} issued`} />
        {certificates.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th scope="col">Recipient</th>
                  <th scope="col">Activity</th>
                  <th scope="col">Template</th>
                  <th scope="col">Certificate no.</th>
                  <th scope="col">Issued</th>
                </tr>
              </thead>
              <tbody>
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td><b>{certificate.recipientName}</b></td>
                    <td>{certificate.eventName}</td>
                    <td>{certificate.template.name}</td>
                    <td>{certificate.certificateNumber}</td>
                    <td>{dateLabel(certificate.issuedAt.slice(0, 10))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Granted certificates appear here." />
        )}
      </section>
    </div>
  );
}
