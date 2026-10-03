import { dateLabel } from './format';

/**
 * Fills a certificate template's placeholders with the granted record's values.
 * Kept beside the other formatters so certificate copy and app copy share one
 * date format.
 */
export function certificateMessage(certificate) {
  const values = {
    recipient: certificate.recipientName,
    event: certificate.eventName,
    eventDate: dateLabel(certificate.eventDate),
    hours: String(certificate.hours),
    certificateNumber: certificate.certificateNumber,
    dateIssued: dateLabel(certificate.issuedAt.slice(0, 10)),
  };
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), certificate.template.message);
}
