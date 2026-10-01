import axios from 'axios';

export const api = axios.create({ baseURL: '/api', timeout: 5000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('campus_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const wait = () => new Promise((resolve) => setTimeout(resolve, 300));
const read = (key, fallback) => {
  try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; }
};
const write = (key, value) => { localStorage.setItem(key, JSON.stringify(value)); return value; };
export const store = { read, write };
export const authService = {
  async login(email, password) {
    await wait();
    const users = read('campus_users', []);
    const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase() && entry.password === password);
    if (!user) throw new Error('That email and password combination was not found.');
    const { password: _, ...safeUser } = user;
    const token = `campus.mock.${btoa(`${user.id}:${Date.now()}`)}`;
    localStorage.setItem('campus_token', token);
    write('campus_session', safeUser);
    return safeUser;
  },
  async register(data) {
    await wait();
    const users = read('campus_users', []);
    if (users.some((entry) => entry.email.toLowerCase() === data.email.toLowerCase())) throw new Error('An account with this email already exists.');
    const user = { ...data, id: `u${Date.now()}`, studentId: data.role === 'student' ? `STU-2026-${String(Date.now()).slice(-4)}` : '' };
    write('campus_users', [...users, user]);
    return this.login(data.email, data.password);
  },
  logout() { localStorage.removeItem('campus_token'); localStorage.removeItem('campus_session'); },
};
export const activityService = {
  async getAll(filters = {}) {
    await wait();
    let items = read('campus_activities', []);
    // Cancelled events remain visible to admins but are never offered as registration opportunities.
    if (!filters.includeCancelled) items = items.filter((item) => item.status !== 'cancelled');
    const query = filters.search?.toLowerCase();
    if (query) items = items.filter((item) => `${item.title} ${item.location} ${item.description}`.toLowerCase().includes(query));
    if (filters.category && filters.category !== 'All categories') items = items.filter((item) => item.category === filters.category);
    if (filters.status && filters.status !== 'All statuses') items = items.filter((item) => item.status === filters.status.toLowerCase());
    return items;
  },
  async create(data) { await wait(); const items = read('campus_activities', []); const activity = { ...data, id: `a${Date.now()}`, spotsAvailable: Number(data.capacity), capacity: Number(data.capacity) }; write('campus_activities', [activity, ...items]); return activity; },
  async update(id, data) { await wait(); const items = read('campus_activities', []); const next = items.map((item) => item.id === id ? { ...item, ...data, capacity: Number(data.capacity), spotsAvailable: Math.min(item.spotsAvailable, Number(data.capacity)) } : item); write('campus_activities', next); return next.find((item) => item.id === id); },
  async delete(id) { await wait(); write('campus_activities', read('campus_activities', []).filter((item) => item.id !== id)); },
  async cancel(id, reason) {
    await wait();
    const items = read('campus_activities', []);
    const next = items.map((item) => item.id === id ? { ...item, status: 'cancelled', cancellationReason: reason, cancelledAt: new Date().toISOString() } : item);
    write('campus_activities', next);
    return next.find((item) => item.id === id);
  },
};
export const certificateTemplateService = {
  getAll() { return read('campus_certificate_templates', [{ id: 'default', name: 'Certificate of Service', description: 'Recognition for approved volunteer service.', title: 'Certificate of Service', message: 'for contributing {hours} approved volunteer hours to the campus community.', organization: 'Good Neighbor · Campus Community', signatory: 'Community Engagement Office', position: 'Community Engagement Office', nameY: 58, designImage: '', overlayRecipientOnly: false }]); },
  async save(template) {
    await wait();
    const templates = this.getAll();
    const next = template.id ? templates.map((item) => item.id === template.id ? { ...item, ...template, updatedAt: new Date().toISOString() } : item) : [...templates, { ...template, id: `ct${Date.now()}`, createdAt: new Date().toISOString() }];
    write('campus_certificate_templates', next);
    return next;
  },
  async delete(id) { await wait(); write('campus_certificate_templates', this.getAll().filter((item) => item.id !== id)); },
};
export const certificateService = {
  getAll() { return read('campus_certificates', []); },
  getForUser(userId) { return this.getAll().filter((certificate) => certificate.userId === userId); },
  async grant({ userId, eventId, templateId, recipientName, title, message, organization, signatory, position }) {
    await wait();
    const users = read('campus_users', []);
    const user = users.find((entry) => entry.id === userId && entry.role === 'student');
    const event = read('campus_activities', []).find((entry) => entry.id === eventId);
    const template = certificateTemplateService.getAll().find((entry) => entry.id === templateId);
    if (!user || !event || !template) throw new Error('Choose a valid student, completed event, and certificate template.');
    if (event.status !== 'completed') throw new Error('Certificates can only be granted for completed events.');
    const certificates = this.getAll();
    if (certificates.some((entry) => entry.userId === userId && entry.eventId === eventId)) throw new Error('This student already has a certificate for this event.');
    const approvedHours = read('campus_records', []).filter((entry) => entry.studentId === user.studentId && entry.activityId === eventId && entry.status === 'approved').reduce((sum, entry) => sum + entry.hoursLogged, 0);
    const issuedAt = new Date().toISOString();
    const certificate = {
      id: `cert${Date.now()}`,
      userId,
      recipientName: recipientName?.trim() || user.name,
      eventId,
      eventName: event.title,
      eventDate: event.date,
      templateId,
      template: {
        ...template,
        title: title?.trim() || template.title,
        message: message ?? template.message,
        organization: organization?.trim() || template.organization,
        signatory: signatory?.trim() || template.signatory,
        position: position?.trim() || template.position,
      },
      hours: approvedHours,
      certificateNumber: `GN-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      issuedAt,
    };
    write('campus_certificates', [...certificates, certificate]);
    return certificate;
  },
};
export const participationService = {
  async signUp(activityId, user) {
    await wait(); const items = read('campus_activities', []); const activity = items.find((entry) => entry.id === activityId);
    if (activity?.status === 'cancelled') throw new Error(activity.cancellationReason ? `This event has been cancelled: ${activity.cancellationReason}` : 'This event has been cancelled.');
    if (!activity || activity.spotsAvailable < 1) throw new Error('This activity is full.');
    const signups = read('campus_signups', []);
    if (signups.some((entry) => entry.activityId === activityId && entry.studentId === user.id)) throw new Error('You are already registered.');
    write('campus_signups', [...signups, { activityId, studentId: user.id }]);
    write('campus_activities', items.map((entry) => entry.id === activityId ? { ...entry, spotsAvailable: entry.spotsAvailable - 1 } : entry));
    return true;
  },
  async logHours(activityId, hours, user) {
    await wait(); const activity = read('campus_activities', []).find((entry) => entry.id === activityId);
    if (!activity) throw new Error('Activity not found.');
    const records = read('campus_records', []); const record = { id: `r${Date.now()}`, studentId: user.studentId, studentName: user.name, activityId, activityTitle: activity.title, date: new Date().toISOString().slice(0, 10), hoursLogged: Number(hours), status: 'pending' };
    write('campus_records', [record, ...records]); return record;
  },
  async approveHours(recordId) { await wait(); const records = read('campus_records', []); const next = records.map((record) => record.id === recordId ? { ...record, status: 'approved' } : record); write('campus_records', next); return next.find((record) => record.id === recordId); },
  async rejectHours(recordId) { await wait(); const records = read('campus_records', []); const next = records.map((record) => record.id === recordId ? { ...record, status: 'rejected' } : record); write('campus_records', next); return next.find((record) => record.id === recordId); },
};
