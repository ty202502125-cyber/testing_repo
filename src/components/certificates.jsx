import { useEffect, useState } from 'react';
import Glyph from './Glyph';
import { Button } from './ui';
import { dateLabel } from '../utils/format';
import { certificateMessage } from '../utils/certificate';

export function CertificateArtwork({ certificate, className = '' }) {
  const template = certificate.template;
  const message = certificateMessage(certificate);
  const hasDesignImage = Boolean(template.designImage);
  const style = hasDesignImage
    ? { backgroundImage: `url("${template.designImage}")`, '--certificate-name-y': `${Number(template.nameY) || 58}%` }
    : undefined;

  return (
    <section
      className={`certificate-sheet ${hasDesignImage ? 'has-design-image' : ''} ${template.overlayRecipientOnly ? 'recipient-only-design' : ''} ${className}`.trim()}
      style={style}
    >
      {!template.overlayRecipientOnly && (
        <>
          <span>{template.organization}</span>
          <h1>{template.title}</h1>
          <p>This certificate is presented to</p>
        </>
      )}
      <h2 className="certificate-recipient">{certificate.recipientName}</h2>
      {message ? <p className="certificate-message">{message}</p> : null}
      {!template.overlayRecipientOnly && (
        <>
          <p className="certificate-number">
            Certificate {certificate.certificateNumber} · Issued {dateLabel(certificate.issuedAt.slice(0, 10))}
          </p>
          <div className="signature">
            <b>{template.signatory}</b>
            <small>{template.position}</small>
          </div>
        </>
      )}
    </section>
  );
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export function GrantedCertificate({ certificate }) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [printOnOpen, setPrintOnOpen] = useState(false);
  const template = certificate.template;
  const message = certificateMessage(certificate);

  useEffect(() => {
    if (!previewOpen || !printOnOpen) return undefined;
    const printTimer = window.setTimeout(() => {
      window.print();
      setPrintOnOpen(false);
    }, 150);
    return () => window.clearTimeout(printTimer);
  }, [previewOpen, printOnOpen]);

  function download() {
    const background = template.designImage ? `background-image:url('${escapeHtml(template.designImage)}');background-size:100% 100%;` : '';
    const certificateBody = template.overlayRecipientOnly
      ? `<h2 class="name recipient-only">${escapeHtml(certificate.recipientName)}</h2>${message ? `<p class="message">${escapeHtml(message)}</p>` : ''}`
      : `<div class="org">${escapeHtml(template.organization)}</div><h1 class="title">${escapeHtml(template.title)}</h1><p>This certificate is presented to</p><h2 class="name">${escapeHtml(certificate.recipientName)}</h2><p class="message">${escapeHtml(message)}</p><p>Certificate no. ${escapeHtml(certificate.certificateNumber)} · Issued ${dateLabel(certificate.issuedAt.slice(0, 10))}</p><div class="signature">${escapeHtml(template.signatory)}<br>${escapeHtml(template.position)}</div>`;
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(template.title)}</title><style>body{font:16px Arial,sans-serif;display:grid;place-items:center;min-height:100vh;background:#f5f7f2;color:#334b37}.certificate{position:relative;box-sizing:border-box;width:900px;max-width:94vw;min-height:600px;padding:90px 70px;border:10px double #17634f;text-align:center;background-color:white;${background}background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.org{letter-spacing:2px}.title{font:700 42px Georgia,serif;margin:40px 0 24px}.name{font:600 34px Georgia,serif;border-bottom:1px solid #829784;padding:0 40px 12px}.message{line-height:1.8;max-width:680px}.signature{border-top:1px solid #687e6b;padding-top:10px;width:260px;margin-top:42px}.recipient-only{position:absolute;top:${Number(template.nameY) || 58}%;left:50%;transform:translate(-50%,-50%)}</style></head><body><main class="certificate">${certificateBody}</main></body></html>`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${certificate.certificateNumber}.html`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <>
      <article className="granted-certificate-card">
        <span className="certificate-icon" aria-hidden="true"><Glyph name="award" size={19} /></span>
        <div className="granted-certificate-info">
          <h3>{template.title}</h3>
          <p>{certificate.eventName} · Issued {dateLabel(certificate.issuedAt.slice(0, 10))}</p>
          <small>Certificate {certificate.certificateNumber}</small>
        </div>
        <div className="certificate-actions">
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>View</Button>
          <Button variant="outline" onClick={() => { setPrintOnOpen(true); setPreviewOpen(true); }}>Print</Button>
          <Button onClick={download}>Download</Button>
        </div>
      </article>
      {previewOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Certificate preview" onMouseDown={(event) => event.target === event.currentTarget && setPreviewOpen(false)}>
          <div className="certificate-viewer">
            <CertificateArtwork certificate={certificate} className="certificate-print-target" />
            <div className="certificate-view-actions">
              <Button variant="outline" onClick={() => window.print()}>Print certificate</Button>
              <Button onClick={download}>Download certificate</Button>
              <Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
