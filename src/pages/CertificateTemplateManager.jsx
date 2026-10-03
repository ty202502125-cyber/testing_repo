import { useState } from 'react';
import Glyph from '../components/Glyph';
import { Button, PageIntro } from '../components/ui';
import { CertificateArtwork } from '../components/certificates';
import { certificateTemplateService } from '../services/api';

const BLANK_TEMPLATE = {
  name: '',
  description: '',
  title: 'Certificate of Service',
  message: 'for contributing {hours} approved volunteer hours to the campus community.',
  organization: 'Campus Connect · Student Community',
  signatory: 'Community Engagement Office',
  position: 'Community Engagement Office',
  nameY: 58,
};

export default function CertificateTemplateManager({ notify }) {
  const [templates, setTemplates] = useState(() => certificateTemplateService.getAll());
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [open, setOpen] = useState(false);
  const [designImage, setDesignImage] = useState('');
  const [overlayRecipientOnly, setOverlayRecipientOnly] = useState(false);
  const [uploadError, setUploadError] = useState('');

  function chooseDesign(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setUploadError('Choose a PNG, JPG, or WebP image.');
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
      setUploadError('The design image must be smaller than 1 GB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDesignImage(String(reader.result));
      setUploadError('');
    };
    reader.onerror = () => setUploadError('The image could not be read. Try another file.');
    reader.readAsDataURL(file);
  }

  async function save(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const updated = await certificateTemplateService.save({
        ...data,
        nameY: Number(data.nameY),
        designImage,
        overlayRecipientOnly,
        ...(editing?.id ? { id: editing.id } : {}),
      });
      setTemplates(updated);
      setOpen(false);
      setEditing(null);
      notify('Certificate template saved.');
    } catch {
      notify('Could not save the template. Try a smaller image or remove the uploaded image.');
    }
  }

  async function remove(template) {
    if (!window.confirm(`Delete template ${template.name}? Certificates already issued stay unchanged.`)) return;
    await certificateTemplateService.delete(template.id);
    setTemplates(certificateTemplateService.getAll());
    notify('Template deleted.');
  }

  return (
    <div className="content-wrap">
      <PageIntro
        title="Certificate templates"
        text="Create and preview the designs used for student service certificates."
        action={<Button onClick={() => { setEditing(null); setDesignImage(''); setOverlayRecipientOnly(false); setUploadError(''); setOpen(true); }}>New template</Button>}
      />

      <div className="template-grid">
        {templates.map((template) => (
          <article className="template-card" key={template.id}>
            <h2>{template.title}</h2>
            <p>{template.description}</p>
            {template.designImage ? <span className="template-image-tag">Uploaded design</span> : null}
            <div className="template-actions">
              <Button variant="outline" onClick={() => setPreview(template)}>Preview</Button>
              <Button variant="outline" onClick={() => { setEditing(template); setDesignImage(template.designImage || ''); setOverlayRecipientOnly(Boolean(template.overlayRecipientOnly)); setUploadError(''); setOpen(true); }}>Edit</Button>
              {template.id !== 'default' ? <Button variant="outline" onClick={() => remove(template)}>Delete</Button> : null}
            </div>
          </article>
        ))}
      </div>

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={editing ? 'Edit template' : 'New template'} onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
          <form className="activity-modal certificate-template-form" onSubmit={save}>
            <div className="modal-heading">
              <div><h2>{editing ? 'Edit template' : 'New template'}</h2></div>
              <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close template editor"><Glyph name="close" size={16} /></button>
            </div>
            <label>Template name<input name="name" defaultValue={editing?.name} placeholder="e.g. Community Service" required /></label>
            <label>Certificate title<input name="title" defaultValue={editing?.title || BLANK_TEMPLATE.title} required /></label>
            <label>Description<input name="description" defaultValue={editing?.description} placeholder="When should this template be used?" required /></label>
            <label>Organization name<input name="organization" defaultValue={editing?.organization || BLANK_TEMPLATE.organization} required /></label>
            <label>
              Message (placeholders: {'{recipient}'}, {'{event}'}, {'{eventDate}'}, {'{hours}'}, {'{certificateNumber}'}, {'{dateIssued}'})
              <textarea name="message" rows="3" defaultValue={editing?.message ?? BLANK_TEMPLATE.message} />
            </label>
            <div className="form-row">
              <label>Signatory name<input name="signatory" defaultValue={editing?.signatory || BLANK_TEMPLATE.signatory} required /></label>
              <label>Signatory position<input name="position" defaultValue={editing?.position || BLANK_TEMPLATE.position} required /></label>
            </div>
            <div className="form-row">
              <label>Recipient name position (%)<input type="number" name="nameY" min="10" max="90" defaultValue={editing?.nameY || BLANK_TEMPLATE.nameY} required /></label>
              <label className="file-input-label">
                Upload a certificate image
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseDesign} />
                <small>PNG, JPG, or WebP. Leave room for the recipient name.</small>
              </label>
            </div>
            {designImage ? (
              <div className="design-upload-preview" style={{ backgroundImage: `url("${designImage}")` }}>
                <span>Image ready</span>
                <Button type="button" variant="outline" onClick={() => { setDesignImage(''); setOverlayRecipientOnly(false); }}>Remove image</Button>
              </div>
            ) : null}
            {uploadError ? <p className="form-error" role="alert">{uploadError}</p> : null}
            <label className="checkbox-label">
              <input type="checkbox" checked={overlayRecipientOnly} onChange={(event) => setOverlayRecipientOnly(event.target.checked)} />
              The uploaded image already has its text; only add the recipient name and any extra message.
            </label>
            <div className="modal-actions">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Save template</Button>
            </div>
          </form>
        </div>
      ) : null}

      {preview ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Template preview" onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)}>
          <div className="certificate-viewer">
            <CertificateArtwork
              certificate={{
                recipientName: 'Preview recipient',
                eventName: 'Preview activity',
                eventDate: '2026-10-11',
                hours: 0,
                certificateNumber: 'PREVIEW',
                issuedAt: '2026-10-01T12:00:00.000Z',
                template: preview,
              }}
            />
            <p className="preview-note">Preview only. Placeholder hours are shown until the certificate is granted.</p>
            <div className="certificate-view-actions">
              <Button variant="outline" onClick={() => setPreview(null)}>Close</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
