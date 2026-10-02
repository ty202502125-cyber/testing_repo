import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/authHooks';
import { activityService, certificateService, certificateTemplateService, participationService, store } from './services/api';
import './App.css';

const Icon = ({ children, size = 18 }) => <span className="icon" style={{ width: size, height: size }}>{children}</span>;
const icons = { home: '⌂', discover: '◉', records: '▤', manage: '▦', approvals: '✓', logout: '↪', search: '⌕', calendar: '▣', pin: '⌖', clock: '◷', users: '♧', arrow: '↗', menu: '☰', close: '×', sparkle: '✳' };
const Glyph = ({ name, size }) => <Icon size={size}>{icons[name] || '•'}</Icon>;
const dateLabel = (date) => new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const today = new Date();
const todayISO = today.toISOString().slice(0, 10);
function Button({ children, variant = 'primary', className = '', ...props }) { return <button className={`button ${variant} ${className}`} {...props}>{children}</button>; }
function Badge({ children, tone = 'neutral' }) { return <span className={`badge ${tone}`}>{children}</span>; }
function ThemeToggle({ theme, onToggle }) {
  const isLight = theme === 'light';
  return <button type="button" className="theme-toggle" onClick={onToggle} aria-label={isLight ? 'Enable dark mode' : 'Enable light mode'} title={isLight ? 'Enable dark mode' : 'Enable light mode'}><span aria-hidden="true">{isLight ? '\u263E' : '\u2600'}</span></button>;
}
function AppShell() {
  const { user, login, register, logout } = useAuth();
  const location = useLocation(); const navigate = useNavigate(); const path = location.pathname;
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('campus_theme') || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('campus_theme', theme); }, [theme]);
  const refresh = () => setRevision((n) => n + 1);
  const notify = (message) => { setToast(message); setTimeout(() => setToast(''), 3200); };
  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';
  useEffect(() => { if (!user && !['/login', '/register'].includes(path)) navigate('/login'); else if (user && ['/login', '/register', '/'].includes(path)) navigate(dashboardPath); }, [user, path, dashboardPath, navigate]);
  const go = (to) => { setMenuOpen(false); navigate(to); window.scrollTo(0, 0); };
  if (!user) return path === '/register'
    ? <AuthPage mode="register" theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} onSubmit={async (values) => { const account = await register(values); go(account.role === 'admin' ? '/admin' : '/dashboard'); }} navigate={go} />
    : <AuthPage mode="login" theme={theme} toggleTheme={() => setTheme(theme === 'light' ? 'dark' : 'light')} onSubmit={async (values) => { await login(values.email, values.password); go(values.role === 'admin' ? '/admin' : '/dashboard'); }} navigate={go} />;

  const admin = user.role === 'admin';
  const navItems = admin ? [['/admin', 'Dashboard', 'home'], ['/admin/activities', 'Manage events', 'manage'], ['/admin/certificates', 'Certificates', 'records'], ['/admin/templates', 'Templates', 'sparkle'], ['/admin/approvals', 'Hours approvals', 'approvals']] : [['/dashboard', 'Overview', 'home'], ['/activities', 'Discover activities', 'discover'], ['/records', 'My service record', 'records']];
  const at = (base) => path === base || path.startsWith(`${base}/`);
  return <div className="app"><header className="topbar"><button className="brand" onClick={() => go(dashboardPath)}><span className="brand-mark">g</span><span>Campus<span className="brand-light"> Connect</span><small>STUDENT COMMUNITY</small></span></button><nav className={`topnav ${menuOpen ? 'open' : ''}`}>{navItems.map(([to, label, icon]) => <button key={to} onClick={() => go(to)} className={`nav-link ${at(to) ? 'selected' : ''}`}><Glyph name={icon} />{label}</button>)}</nav><div className="profile"><ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'light' ? 'dark' : 'light')} /><button className="avatar" onClick={() => go(dashboardPath)}>{user.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}</button><div className="profile-meta"><b>{user.name}</b><span>{admin ? 'Community admin' : 'Student volunteer'}</span></div><span className="profile-separator"/><button title="Sign out" className="icon-button logout" onClick={() => { logout(); go('/login'); }}><Glyph name="logout" /></button><button className="icon-button hamburger" onClick={() => setMenuOpen(!menuOpen)}><Glyph name={menuOpen ? 'close' : 'menu'} /></button></div></header>
    <main className="main-content" key={`${path}-${revision}`}>
      {path === '/dashboard' && !admin && <StudentDashboard user={user} go={go} notify={notify} />}
      {path === '/activities' && !admin && <ActivityFeed go={go} />}
      {path.startsWith('/activities/') && !admin && <ActivityDetail id={path.split('/').pop()} go={go} notify={notify} user={user} refresh={refresh} />}
      {path === '/records' && !admin && <StudentRecords user={user} notify={notify} />}
      {(path === '/admin' || (admin && path === '/admin/approvals')) && admin && <AdminDashboard approvals={path.endsWith('approvals')} notify={notify} />}
      {path === '/admin/activities' && admin && <AdminActivityManager notify={notify} />}
      {path === '/admin/templates' && admin && <CertificateTemplateManager notify={notify} />}
      {path === '/admin/certificates' && admin && <AdminCertificates notify={notify} />}
      {((path.startsWith('/admin') && !admin) || (!path.startsWith('/admin') && admin)) && <div className="not-found panel"><h2>That view isn’t available for your account.</h2><Button onClick={() => go(dashboardPath)}>Go to your dashboard</Button></div>}
    </main><footer className="footer"><span>© 2026 Campus Connect</span><span>Small acts. Shared impact.</span></footer>{toast && <div className="toast"><span>✓</span>{toast}</div>}</div>;
}
function AuthPage({ mode, onSubmit, navigate, theme, toggleTheme }) {
  const registerMode = mode === 'register'; const [role, setRole] = useState('student'); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) { e.preventDefault(); setError(''); const data = Object.fromEntries(new FormData(e.currentTarget)); if (!/^\S+@\S+\.\S+$/.test(data.email)) return setError('Enter a valid email address.'); if (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password)) return setError('Use 8+ characters, including one uppercase letter and one number.'); if (registerMode && data.password !== data.confirm) return setError('Your passwords do not match.'); setBusy(true); try { await onSubmit({ ...data, role }); } catch (err) { setError(err.message); setBusy(false); } }
  return <div className="auth-layout"><ThemeToggle theme={theme} onToggle={toggleTheme} /><aside className="auth-aside"><button className="brand inverse" onClick={() => navigate('/login')}><span className="brand-mark">g</span><span>Campus<span className="brand-light"> Connect</span><small>STUDENT COMMUNITY</small></span></button><div className="auth-quote"><span className="eyebrow">MAKE YOUR TIME MATTER</span><h1>Do good.<br/><em>Feel good.</em></h1><p>Find your people, show up for your community, and turn a few hours into a lasting impact.</p><div className="quote-stat"><b>1,284</b><span>students making a difference this semester</span></div><div className="auth-dots"><i/><i/><i/></div></div><div className="aside-footer">A little good goes a long way <span>✳</span></div></aside><section className="auth-main"><div className="auth-card"><div className="auth-mobile-brand"><span className="brand-mark">g</span> Campus Connect</div><Badge tone="green">✳ &nbsp;YOUR COMMUNITY STARTS HERE</Badge><h2>{registerMode ? 'Create your account' : 'Welcome back'}</h2><p className="auth-subtitle">{registerMode ? 'Join a campus full of people who care.' : 'Pick up where your good work left off.'}</p><form onSubmit={submit} className="form-stack">{registerMode && <><label>Full name<input name="name" autoComplete="name" placeholder="e.g. Maya Santos" required/></label><div className="role-toggle"><button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}><span>🎓</span> Student</button><button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}><span>✦</span> Admin</button></div><label>Department<input name="department" placeholder="e.g. Environmental Science" required/></label></>}<label>School email<input name="email" type="email" autoComplete="email" defaultValue={registerMode ? '' : 'maya@campus.edu'} placeholder="you@campus.edu" required/></label><label>Password<input name="password" type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} defaultValue={registerMode ? '' : 'Campus123!'} placeholder="At least 8 characters" required/></label>{registerMode && <label>Confirm password<input name="confirm" type="password" autoComplete="new-password" placeholder="Re-enter your password" required/></label>}{error && <div className="form-error">{error}</div>}<Button disabled={busy} className="auth-submit">{busy ? 'Please wait…' : registerMode ? 'Create account' : 'Sign in'} <span>→</span></Button></form>{!registerMode && <div className="demo-hint"><b>Quick demo access</b><span>Student: maya@campus.edu &nbsp;·&nbsp; Admin: admin@campus.edu</span><span>Password for both: <strong>Campus123!</strong></span></div>}<p className="auth-switch">{registerMode ? 'Already part of the community?' : 'New around here?'} <button onClick={() => navigate(registerMode ? '/login' : '/register')}>{registerMode ? 'Sign in' : 'Create an account'}</button></p></div><div className="auth-legal">By continuing, you agree to our <a>Community Guidelines</a> and <a>Privacy Policy</a></div></section></div>;
}
function PageIntro({ eyebrow, title, text, action }) { return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div>{action}</div>; }
function StatCard({ icon, value, label, foot, accent = '' }) { return <article className="stat-card"><div className={`stat-icon ${accent}`}><Glyph name={icon}/></div><span className="stat-label">{label}</span><b>{value}</b><span className="stat-foot">{foot}</span></article>; }
function ActivityCard({ item, go }) { return <article className="activity-card"><div className={`activity-cover cover-${item.category.toLowerCase().replaceAll(' ', '-')}`}><span className="cover-emoji">{item.image}</span><Badge tone={item.status === 'open' ? 'green' : 'neutral'}>{item.status}</Badge><span className="cover-date">{new Date(`${item.date}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span></div><div className="activity-card-body"><div className="activity-category">{item.category} <span>·</span> Hosted by {item.organizer}</div><h3>{item.title}</h3><p>{item.description}</p><div className="activity-meta"><span><Glyph name="pin"/>{item.location.split(',')[0]}</span><span><Glyph name="clock"/>{item.startTime}–{item.endTime}</span></div><div className="activity-card-footer"><span className={item.spotsAvailable < 5 ? 'spots low' : 'spots'}>{item.spotsAvailable} spots left</span><button className="text-action" onClick={() => go(`/activities/${item.id}`)}>View details <span>↗</span></button></div></div></article>; }
function StudentDashboard({ user, go }) {
  const records = participationService.getRecordsForUser(user); const hours = records.filter((r) => r.status === 'approved').reduce((sum, r) => sum + Number(r.hoursLogged || 0), 0); const pending = records.filter((r) => r.status === 'pending').length;
  const upcoming = store.read('campus_activities', []).filter((a) => a.status === 'open' && a.date >= todayISO).slice(0, 3);
  return <div className="content-wrap"><PageIntro eyebrow="YOUR VOLUNTEER SPACE" title={<>Good morning, {user.name.split(' ')[0]} <span className="wave">✳</span></>} text="Your next good thing is just around the corner." action={<Button variant="outline" onClick={() => go('/records')}>View my service record <span>→</span></Button>}/><div className="stats-grid"><StatCard icon="sparkle" value={`${hours.toFixed(hours % 1 ? 1 : 0)} hrs`} label="APPROVED HOURS" foot="Every hour makes a difference" accent="stat-green"/><StatCard icon="calendar" value={upcoming.length} label="UPCOMING ACTIVITIES" foot="Find your next opportunity" accent="stat-blue"/><StatCard icon="clock" value={pending} label="HOURS PENDING" foot={pending ? 'Your hours are being reviewed' : 'All caught up'} accent="stat-amber"/></div><section className="section-block"><div className="section-heading"><div><span className="eyebrow">FIND YOUR NEXT YES</span><h2>Coming up on campus</h2></div><button className="text-action" onClick={() => go('/activities')}>Explore all activities <span>→</span></button></div><div className="activity-grid">{upcoming.map((item) => <ActivityCard key={item.id} item={item} go={go}/>)}</div></section><section className="lower-grid"><article className="impact-panel"><span className="impact-orb">✳</span><span className="eyebrow">YOUR IMPACT, IN MOTION</span><h2>Small acts add up.</h2><p>You’ve already shown up for your community. Keep going—your next few hours could make someone’s whole week.</p><Button variant="dark" onClick={() => go('/activities')}>Find an activity <span>→</span></Button></article><article className="recent-panel"><div className="section-heading"><div><span className="eyebrow">LOOKING BACK</span><h2>Recent service</h2></div><button className="text-action" onClick={() => go('/records')}>See all <span>→</span></button></div>{records.slice(0, 3).map((r) => <div className="recent-row" key={r.id}><span className="recent-emoji">{r.status === 'approved' ? '🌳' : '⏳'}</span><div><b>{r.activityTitle}</b><small>{dateLabel(r.date)} · {r.hoursLogged} hours</small></div><Badge tone={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : 'red'}>{r.status}</Badge></div>)}{!records.length && <Empty message="Your service history will appear here."/>}</article></section></div>;
}
function ActivityFeed({ go }) {
  const [items, setItems] = useState([]); const [search, setSearch] = useState(''); const [category, setCategory] = useState('All categories'); const [status, setStatus] = useState('All statuses'); const [loading, setLoading] = useState(true);
  useEffect(() => { let active = true; activityService.getAll({ search, category, status }).then((data) => { if (active) { setItems(data); setLoading(false); } }); return () => { active = false; }; }, [search, category, status]);
  const options = ['Environment', 'Campus Care', 'Tutoring', 'Community'];
  return <div className="content-wrap"><PageIntro eyebrow="OPPORTUNITIES TO SHOW UP" title="Find your kind of good." text="A few hours can change a day. Pick an opportunity that feels like you."/><div className="feed-tools"><label className="search-field"><Glyph name="search"/><input value={search} onChange={(e) => { setLoading(true); setSearch(e.target.value); }} placeholder="Search activities, places, causes…"/></label><select aria-label="Filter by category" value={category} onChange={(e) => { setLoading(true); setCategory(e.target.value); }}><option>All categories</option>{options.map((o) => <option key={o}>{o}</option>)}</select><select aria-label="Filter by status" value={status} onChange={(e) => { setLoading(true); setStatus(e.target.value); }}><option>All statuses</option><option>Open</option><option>Ongoing</option><option>Completed</option></select></div><div className="feed-result-line"><span>{loading ? 'Finding opportunities…' : `${items.length} ${items.length === 1 ? 'opportunity' : 'opportunities'} to explore`}</span><span>Sort: <b>Upcoming first</b></span></div>{loading ? <div className="activity-grid">{[0, 1, 2].map((n) => <div className="skeleton-card" key={n}><div/><i/><i/><i/></div>)}</div> : items.length ? <div className="activity-grid">{items.map((item) => <ActivityCard item={item} key={item.id} go={go}/>)}</div> : <Empty message="No activities found. Try adjusting your search or filters."/>}</div>;
}
function ActivityDetail({ id, go, notify, user, refresh }) {
  const activity = store.read('campus_activities', []).find((item) => item.id === id); const registered = store.read('campus_signups', []).some((entry) => entry.activityId === id && entry.studentId === user.id); const [busy, setBusy] = useState(false);
  if (!activity) return <div className="content-wrap"><Empty message="We couldn’t find that activity."/><Button onClick={() => go('/activities')}>Back to activities</Button></div>;
  async function signup() { setBusy(true); try { await participationService.signUp(id, user); notify('You’re on the list! See you there.'); refresh(); } catch (error) { notify(error.message); } finally { setBusy(false); } }
  return <div className="content-wrap detail-wrap"><button className="back-link" onClick={() => go('/activities')}>← &nbsp;All activities</button><div className="detail-hero"><span className="detail-emoji">{activity.image}</span><Badge tone={activity.status === 'cancelled' ? 'red' : 'green'}>{activity.status === 'cancelled' ? 'Cancelled' : activity.category}</Badge><h1>{activity.title}</h1><p>{activity.description}</p>{activity.status === 'cancelled' && <p className="cancelled-message">This event has been cancelled. {activity.cancellationReason && `Reason: ${activity.cancellationReason}`}</p>}<div className="detail-organizer">Organized by <b>{activity.organizer}</b></div></div><div className="detail-layout"><div><div className="detail-info-grid"><div className="detail-info"><span className="detail-info-icon"><Glyph name="calendar"/></span><div><small>DATE</small><b>{dateLabel(activity.date)}</b></div></div><div className="detail-info"><span className="detail-info-icon"><Glyph name="clock"/></span><div><small>TIME</small><b>{activity.startTime} – {activity.endTime}</b></div></div><div className="detail-info"><span className="detail-info-icon"><Glyph name="pin"/></span><div><small>LOCATION</small><b>{activity.location}</b></div></div><div className="detail-info"><span className="detail-info-icon"><Glyph name="users"/></span><div><small>OPEN SPOTS</small><b>{activity.spotsAvailable} of {activity.capacity} available</b></div></div></div><div className="map-placeholder"><span>⌖</span><b>{activity.location}</b><small>Campus location · Directions available after sign-up</small></div><div className="what-to-know"><span className="eyebrow">GOOD TO KNOW</span><p>Come as you are. Your organizer will share everything you need to know before the activity. Bring a reusable water bottle and comfortable shoes.</p></div></div><aside className="signup-card"><span className="eyebrow">READY TO SHOW UP?</span><h3>Your community is counting on you.</h3><p>Reserve your place and make a little good happen.</p><div className="spots-meter"><span><b>{activity.spotsAvailable}</b> places remaining</span><div><i style={{ width: `${Math.max(5, (activity.spotsAvailable / activity.capacity) * 100)}%` }}/></div></div><Button disabled={activity.status === 'cancelled' || registered || activity.spotsAvailable === 0 || busy} onClick={signup}>{activity.status === 'cancelled' ? 'Event cancelled' : registered ? '✓  You’re registered' : activity.spotsAvailable === 0 ? 'This activity is full' : busy ? 'Saving your spot…' : 'Sign me up  →'}</Button><small>By signing up, you agree to show up or let the organizer know.</small></aside></div></div>;
}
function Empty({ message }) { return <div className="empty-state"><span>✳</span><h3>Nothing here yet</h3><p>{message}</p></div>; }
function certificateMessage(certificate) {
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
function CertificateArtwork({ certificate, className = '' }) {
  const template = certificate.template;
  const message = certificateMessage(certificate);
  const hasDesignImage = Boolean(template.designImage);
  const style = hasDesignImage ? {
    backgroundImage: `url("${template.designImage}")`,
    '--certificate-name-y': `${Number(template.nameY) || 58}%`,
  } : undefined;
  return <section className={`certificate-sheet ${hasDesignImage ? 'has-design-image' : ''} ${template.overlayRecipientOnly ? 'recipient-only-design' : ''} ${className}`} style={style}>
    {!template.overlayRecipientOnly && <><span>{template.organization}</span><h1>{template.title}</h1><p>This certificate is presented to</p></>}
    <h2 className="certificate-recipient">{certificate.recipientName}</h2>
    {message && <p className="certificate-message">{message}</p>}
    {!template.overlayRecipientOnly && <><p className="certificate-number">Certificate {certificate.certificateNumber} · Issued {dateLabel(certificate.issuedAt.slice(0, 10))}</p><div className="signature"><b>{template.signatory}</b><small>{template.position}</small></div></>}
  </section>;
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function GrantedCertificate({ certificate }) {
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
    const content = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(template.title)}</title><style>body{font:16px Arial,sans-serif;display:grid;place-items:center;min-height:100vh;background:#f5f7f2;color:#334b37}.certificate{position:relative;box-sizing:border-box;width:900px;max-width:94vw;min-height:600px;padding:90px 70px;border:10px double #4b7153;text-align:center;background-color:white;${background}background-position:center;display:flex;flex-direction:column;align-items:center;justify-content:center}.org{letter-spacing:2px}.title{font:700 42px Georgia,serif;margin:40px 0 24px}.name{font:600 34px Georgia,serif;border-bottom:1px solid #829784;padding:0 40px 12px}.message{line-height:1.8;max-width:680px}.signature{border-top:1px solid #687e6b;padding-top:10px;width:260px;margin-top:42px}.recipient-only{position:absolute;top:${Number(template.nameY) || 58}%;left:50%;transform:translate(-50%,-50%)}</style></head><body><main class="certificate">${certificateBody}</main></body></html>`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${certificate.certificateNumber}.html`; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return <>
    <article className="granted-certificate-card"><span className="certificate-icon" aria-hidden="true">✦</span><div className="granted-certificate-info"><span className="eyebrow">{template.organization}</span><h3>{template.title}</h3><p>{certificate.eventName} · Issued {dateLabel(certificate.issuedAt.slice(0, 10))}</p><small>Certificate {certificate.certificateNumber}</small></div><div className="certificate-actions"><Button variant="outline" onClick={() => setPreviewOpen(true)}>View</Button><Button variant="outline" onClick={() => { setPrintOnOpen(true); setPreviewOpen(true); }}>Print</Button><Button onClick={download}>Download</Button></div></article>
    {previewOpen && <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && setPreviewOpen(false)}><div className="certificate-viewer"><CertificateArtwork certificate={certificate} className="certificate-print-target" /><div className="certificate-view-actions"><Button variant="outline" onClick={() => window.print()}>Print certificate</Button><Button onClick={download}>Download certificate</Button><Button variant="outline" onClick={() => setPreviewOpen(false)}>Close</Button></div></div></div>}
  </>;
}
function StudentRecords({ user, notify }) {
  const [certificates] = useState(() => certificateService.getForUser(user.id));
  const [records, setRecords] = useState(() => participationService.getRecordsForUser(user));
  const [submitting, setSubmitting] = useState(false);
  const total = records.filter((r) => r.status === 'approved').reduce((sum, r) => sum + Number(r.hoursLogged || 0), 0);
  const activities = store.read('campus_activities', []);
  const eligible = records.filter((r) => ['registered', 'rejected'].includes(r.status)).map((r) => activities.find((a) => a.id === r.activityId)).filter(Boolean);
  const completed = activities.filter((a) => a.status === 'completed' && !records.some((r) => r.activityId === a.id));
  const loggable = [...new Map([...eligible, ...completed].map((a) => [a.id, a])).values()];
  async function logHours(e) {
    e.preventDefault(); const form = e.currentTarget; setSubmitting(true); const data = Object.fromEntries(new FormData(form));
    try { const record = await participationService.logHours(data.activityId, data.hours, user); setRecords((current) => [record, ...current.filter((r) => r.activityId !== record.activityId)]); form.reset(); notify('Hours submitted for admin approval.'); }
    catch (error) { notify(error.message); } finally { setSubmitting(false); }
  }
  return <div className="content-wrap"><PageIntro eyebrow="YOUR HOURS, YOUR IMPACT" title="Service record" text="Events you join are added here automatically. Submit your hours after participating for admin review."/><div className="record-banner"><div><span className="eyebrow">OFFICIALLY LOGGED</span><b>{total} <small>approved hours</small></b><p>Thank you for making a difference in our community.</p></div><div className="hour-art">{[18, 29, 42, 33, 51, 40, 61, 46, 72, 56, 83, 68].map((height, i) => <i key={i} style={{ height: `${height}px`, opacity: 0.3 + i * 0.055 }}/>)}</div></div><section className="records-panel log-hours-panel"><div><span className="eyebrow">ADD TO YOUR SERVICE RECORD</span><h2>Submit event hours</h2><p>Choose an event you joined, enter your hours, and an admin will review them.</p></div><form className="hours-form" onSubmit={logHours}><label>Event<select name="activityId" required defaultValue=""><option value="" disabled>Select an event</option>{loggable.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label><label>Hours<input name="hours" type="number" min="0.5" max="24" step="0.5" placeholder="e.g. 3" required/></label><Button disabled={!loggable.length || submitting}>{submitting ? 'Submitting�' : 'Submit hours ?'}</Button></form>{!loggable.length && <small className="no-completed">Join an event first. It will appear here so you can submit your hours after participating.</small>}</section><section className="records-panel"><div className="section-heading"><div><span className="eyebrow">YOUR CONTRIBUTIONS</span><h2>Activity history</h2></div><span className="record-count">{records.length} records</span></div><div className="table-scroll"><table><thead><tr><th>ACTIVITY</th><th>DATE</th><th>HOURS</th><th>STATUS</th></tr></thead><tbody>{records.map((r) => <tr key={r.id}><td><b>{r.activityTitle}</b><small>Campus / community event</small></td><td>{dateLabel(r.date)}</td><td><b>{r.hoursLogged ? `${r.hoursLogged} hrs` : 'Not submitted'}</b></td><td><Badge tone={r.status === 'approved' ? 'green' : r.status === 'pending' ? 'yellow' : r.status === 'registered' ? 'neutral' : 'red'}>{r.status}</Badge></td></tr>)}</tbody></table>{!records.length && <Empty message="Join an event to start building your service record."/>}</div></section><section className="certificates-section"><div className="section-heading"><div><span className="eyebrow">RECOGNITION</span><h2>My certificates</h2><p>Certificates granted by your admin are stored here.</p></div><span className="record-count">{certificates.length} certificates</span></div>{certificates.length ? <div className="granted-certificate-list">{certificates.map((certificate) => <GrantedCertificate key={certificate.id} certificate={certificate} />)}</div> : <Empty message="Your certificates will appear here when an administrator grants one." />}</section></div>;
}function AdminDashboard({ approvals, notify }) {
  const activities = store.read('campus_activities', []); const records = participationService.getAllRecords(); const [version, setVersion] = useState(0); const pending = records.filter((r) => r.status === 'pending'); const hours = records.filter((r) => r.status === 'approved').reduce((sum, r) => sum + Number(r.hoursLogged || 0), 0); const students = new Set(records.map((r) => r.userId || r.studentId)).size;
  async function decide(record, verdict) { if (verdict === 'approved') await participationService.approveHours(record.id); else await participationService.rejectHours(record.id); setVersion(version + 1); notify(verdict === 'approved' ? `${record.studentName}’s hours were approved.` : `${record.studentName}’s submission was declined.`); }
  return <div className="content-wrap"><PageIntro eyebrow="COMMUNITY OPERATIONS" title={approvals ? 'Hours approvals' : 'Good work is happening.'} text={approvals ? 'Review student submissions and keep the community record accurate.' : 'Here’s the good your campus community is putting into the world.'} action={<div className="admin-chip"><span/>ADMIN VIEW</div>}/>{!approvals && <div className="stats-grid"><StatCard icon="calendar" value={activities.filter((a) => a.status === 'open').length} label="ACTIVE ACTIVITIES" foot="Open for sign-ups" accent="stat-blue"/><StatCard icon="users" value={students} label="PARTICIPATING STUDENTS" foot="Across all recorded activities" accent="stat-green"/><StatCard icon="sparkle" value={`${hours} hrs`} label="HOURS CONTRIBUTED" foot="Approved volunteer time" accent="stat-amber"/></div>}<section className="records-panel admin-records"><div className="section-heading"><div><span className="eyebrow">NEEDS YOUR ATTENTION</span><h2>Pending hour submissions <span className="pending-count">{pending.length}</span></h2></div><span className="record-count">{pending.length} to review</span></div>{pending.length ? <div className="table-scroll"><table><thead><tr><th>STUDENT</th><th>ACTIVITY</th><th>DATE</th><th>HOURS</th><th>ACTION</th></tr></thead><tbody>{pending.map((r) => <tr key={`${r.id}-${version}`}><td><div className="student-cell"><span className="avatar small-avatar">{r.studentName.split(' ').map((n) => n[0]).join('')}</span><div><b>{r.studentName}</b><small>{r.studentId}</small></div></div></td><td><b>{r.activityTitle}</b><small>Service activity</small></td><td>{dateLabel(r.date)}</td><td><b>{r.hoursLogged} hrs</b></td><td><div className="row-actions"><button className="approve-btn" onClick={() => decide(r, 'approved')}>✓ Approve</button><button className="reject-btn" onClick={() => decide(r, 'rejected')}>Decline</button></div></td></tr>)}</tbody></table></div> : <Empty message="All caught up. New student submissions will appear here."/>}</section><section className="admin-tip"><span>✳</span><p><b>Kindness deserves careful records.</b><br/>Check that the activity and hours look right before approving a submission.</p></section></div>;
}
function AdminActivityManager({ notify }) {
  const [activities, setActivities] = useState(() => store.read('campus_activities', [])); const [open, setOpen] = useState(false); const [editing, setEditing] = useState(null); const [busy, setBusy] = useState(false);
  const sync = () => setActivities(store.read('campus_activities', []));
  async function save(e) { e.preventDefault(); setBusy(true); const data = Object.fromEntries(new FormData(e.currentTarget)); const [startTime, endTime] = data.timeRange.split('|'); const payload = { title: data.title, category: data.category, date: data.date, startTime, endTime, location: data.location, capacity: Number(data.capacity), description: data.description, status: data.status, organizer: 'Community Outreach Office', image: data.category === 'Environment' ? '🌿' : data.category === 'Tutoring' ? '📚' : '🤝' }; if (editing) await activityService.update(editing.id, payload); else await activityService.create(payload); sync(); setOpen(false); setBusy(false); notify(editing ? 'Activity details updated.' : 'Activity published.'); }
  async function remove(item) { if (confirm(`Delete “${item.title}”?`)) { await activityService.delete(item.id); sync(); notify('Activity removed.'); } }
  async function cancel(item) { const reason = window.prompt("Enter a cancellation reason (optional)."); if (reason === null) return; if (!window.confirm("Cancel this event? New registrations will be disabled.")) return; await activityService.cancel(item.id, reason.trim()); sync(); notify("Event cancelled."); }
  function edit(item) { setEditing(item); setOpen(true); }
  return <div className="content-wrap"><PageIntro eyebrow="MAKE GOOD THINGS HAPPEN" title="Manage activities" text="Create opportunities, keep details fresh, and make it easy to show up." action={<Button onClick={() => { setEditing(null); setOpen(true); }}>＋ &nbsp;New activity</Button>}/><div className="manager-summary"><span className="manager-icon">▦</span><div><b>{activities.length} activities</b><small>{activities.filter((a) => a.status === 'open').length} open for sign-up · {activities.filter((a) => a.status === 'completed').length} completed</small></div><span className="record-count">This semester</span></div><section className="records-panel manager-panel"><div className="section-heading"><div><span className="eyebrow">YOUR CAMPUS CALENDAR</span><h2>All activities</h2></div></div><div className="table-scroll"><table><thead><tr><th>ACTIVITY</th><th>DATE</th><th>CATEGORY</th><th>SPOTS LEFT</th><th>STATUS</th><th/></tr></thead><tbody>{activities.map((a) => <tr key={a.id}><td><b>{a.title}</b><small>{a.location}</small></td><td>{dateLabel(a.date)}</td><td>{a.category}</td><td><b>{a.spotsAvailable}</b> / {a.capacity}</td><td><Badge tone={a.status === 'cancelled' ? 'red' : a.status === 'open' ? 'green' : a.status === 'completed' ? 'neutral' : 'yellow'}>{a.status}</Badge></td><td><div className="row-actions"><button className="edit-btn" onClick={() => edit(a)}>Edit</button>{a.status !== 'cancelled' && a.status !== 'completed' && <button className="reject-btn" onClick={() => cancel(a)}>Cancel event</button>}<button className="reject-btn" onClick={() => remove(a)}>Delete</button></div></td></tr>)}</tbody></table></div></section>{open && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}><form className="activity-modal" onSubmit={save}><div className="modal-heading"><div><span className="eyebrow">{editing ? 'KEEP IT UP TO DATE' : 'CREATE A NEW OPPORTUNITY'}</span><h2>{editing ? 'Edit activity' : 'New activity'}</h2></div><button type="button" className="icon-button" onClick={() => setOpen(false)}>×</button></div><label>Activity title<input name="title" defaultValue={editing?.title} placeholder="e.g. Saturday garden cleanup" required/></label><div className="form-row"><label>Category<select name="category" defaultValue={editing?.category || 'Environment'}><option>Environment</option><option>Campus Care</option><option>Tutoring</option><option>Community</option></select></label><label>Activity status<select name="status" defaultValue={editing?.status || 'open'}><option value="open">Open</option><option value="ongoing">Ongoing</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select></label></div><div className="form-row"><label>Date<input type="date" name="date" defaultValue={editing?.date} required/></label><label>Max attendees<input type="number" name="capacity" min="1" defaultValue={editing?.capacity || 20} required/></label></div><label>Time range<select name="timeRange" defaultValue={editing ? `${editing.startTime}|${editing.endTime}` : '09:00|12:00'}><option value="07:30|11:30">7:30 AM – 11:30 AM</option><option value="08:00|12:00">8:00 AM – 12:00 PM</option><option value="09:00|12:00">9:00 AM – 12:00 PM</option><option value="13:00|16:00">1:00 PM – 4:00 PM</option><option value="10:00|13:00">10:00 AM – 1:00 PM</option></select></label><label>Location<input name="location" defaultValue={editing?.location} placeholder="Building, room, or meeting point" required/></label><label>What will volunteers do?<textarea name="description" defaultValue={editing?.description} rows="3" placeholder="Give students a feel for what to expect…" required/></label><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Publish activity'} <span>→</span></Button></div></form></div>}</div>;
}
function CertificateTemplateManager({ notify }) {
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
      if (file.size > 1 * 1024 * 1024 * 1024) {
      setUploadError('The design image must be smaller than 1 GB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => { setDesignImage(String(reader.result)); setUploadError(''); };
    reader.onerror = () => setUploadError('The image could not be read. Try another file.');
    reader.readAsDataURL(file);
  }
  async function save(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget));
    try {
      const updated = await certificateTemplateService.save({ ...data, nameY: Number(data.nameY), designImage, overlayRecipientOnly, ...(editing?.id ? { id: editing.id } : {}) });
      setTemplates(updated); setOpen(false); setEditing(null); notify('Certificate template saved.');
    } catch {
      notify('Could not save the template. Try a smaller image or remove the uploaded image.');
    }
  }
  async function remove(template) {
    if (!confirm(`Delete template ${template.name}? Existing certificates already issued will remain unchanged.`)) return;
    await certificateTemplateService.delete(template.id); setTemplates(certificateTemplateService.getAll()); notify('Template deleted.');
  }
  const blank = { name: '', description: '', title: 'Certificate of Service', message: 'for contributing {hours} approved volunteer hours to the campus community.', organization: 'Campus Connect - Student Community', signatory: 'Community Engagement Office', position: 'Community Engagement Office', nameY: 58 };
  return <div className="content-wrap"><PageIntro eyebrow="RECOGNIZE COMMUNITY IMPACT" title="Certificate templates" text="Create and preview the designs used for student service certificates." action={<Button onClick={() => { setEditing(null); setDesignImage(''); setOverlayRecipientOnly(false); setUploadError(''); setOpen(true); }}>+ New template</Button>} />
    <div className="template-grid">{templates.map((template) => <article className="template-card" key={template.id}><span className="eyebrow">{template.organization}</span><h2>{template.title}</h2><p>{template.description}</p>{template.designImage && <span className="template-image-tag">Uploaded design</span>}<div className="template-actions"><Button variant="outline" onClick={() => setPreview(template)}>Preview</Button><Button variant="outline" onClick={() => { setEditing(template); setDesignImage(template.designImage || ''); setOverlayRecipientOnly(Boolean(template.overlayRecipientOnly)); setUploadError(''); setOpen(true); }}>Edit</Button>{template.id !== 'default' && <Button variant="outline" onClick={() => remove(template)}>Delete</Button>}</div></article>)}</div>
    {open && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}><form className="activity-modal certificate-template-form" onSubmit={save}><div className="modal-heading"><div><span className="eyebrow">CERTIFICATE DESIGN</span><h2>{editing ? 'Edit template' : 'New template'}</h2></div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Close template editor">Close</button></div><label>Template name<input name="name" defaultValue={editing?.name} placeholder="e.g. Community Service" required /></label><label>Certificate title<input name="title" defaultValue={editing?.title || blank.title} required /></label><label>Description<input name="description" defaultValue={editing?.description} placeholder="When should this template be used?" required /></label><label>Organization name<input name="organization" defaultValue={editing?.organization || blank.organization} required /></label><label>Message (placeholders: {'{recipient}'}, {'{event}'}, {'{eventDate}'}, {'{hours}'}, {'{certificateNumber}'}, {'{dateIssued}'})<textarea name="message" rows="3" defaultValue={editing?.message ?? blank.message} /></label><div className="form-row"><label>Signatory name<input name="signatory" defaultValue={editing?.signatory || blank.signatory} required /></label><label>Signatory position<input name="position" defaultValue={editing?.position || blank.position} required /></label></div><div className="form-row"><label>Recipient name position (%)<input type="number" name="nameY" min="10" max="90" defaultValue={editing?.nameY || blank.nameY} required /></label><label className="file-input-label">Upload a certificate image<input type="file" accept="image/png,image/jpeg,image/webp" onChange={chooseDesign} /><small>PNG, JPG, or WebP, up to 500 KB. Leave room for the recipient name.</small></label></div>{designImage && <div className="design-upload-preview" style={{ backgroundImage: `url("${designImage}")` }}><span>Image ready</span><Button type="button" variant="outline" onClick={() => { setDesignImage(''); setOverlayRecipientOnly(false); }}>Remove image</Button></div>}{uploadError && <p className="form-error" role="alert">{uploadError}</p>}<label className="checkbox-label"><input type="checkbox" checked={overlayRecipientOnly} onChange={(event) => setOverlayRecipientOnly(event.target.checked)} /> The uploaded image already has its text; only add the recipient name and any extra message.</label><div className="modal-actions"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button>Save template</Button></div></form></div>}
    {preview && <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setPreview(null)}><div className="certificate-viewer"><CertificateArtwork certificate={{ recipientName: 'Jordan Lee', eventName: 'Campus Garden Day', eventDate: '2026-10-11', hours: 12, certificateNumber: 'GN-2026-001', issuedAt: '2026-10-01T12:00:00.000Z', template: preview }} /><div className="certificate-view-actions"><Button variant="outline" onClick={() => setPreview(null)}>Close</Button></div></div></div>}
  </div>;
}
function AdminCertificates({ notify }) {
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
  const previewCertificate = selectedTemplate ? {
    recipientName: recipientName || 'Recipient name',
    eventName: selectedEvent?.title || 'Selected event',
    eventDate: selectedEvent?.date || todayISO,
    hours: 0,
    certificateNumber: 'GN-PREVIEW',
    issuedAt: `${todayISO}T12:00:00.000Z`,
    template: { ...selectedTemplate, title, message, organization, signatory, position },
  } : null;
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
      await certificateService.grant({ userId: data.userId, eventId: data.eventId, templateId: data.templateId, recipientName: data.recipientName, title: data.title, message: data.message, organization: data.organization, signatory: data.signatory, position: data.position });
      setCertificates(certificateService.getAll());
      form.reset();
      setUserId(''); setEventId(''); setRecipientName('');
      notify('Certificate granted. The student can now view and download it.');
    } catch (error) {
      notify(error.message || 'Could not grant this certificate.');
    } finally {
      setBusy(false);
    }
  }
  return <div className="content-wrap"><PageIntro eyebrow="STUDENT RECOGNITION" title="Granted certificates" text="Grant an event certificate to a student. It will appear in their service record." />
    <section className="records-panel grant-certificate-panel"><div><span className="eyebrow">ISSUE A CERTIFICATE</span><h2>Customize and grant</h2><p>Start with a template, then freely edit the certificate details for this recipient.</p></div>{students.length && completedEvents.length && templates.length ? <form className="grant-certificate-form" onSubmit={grant}><div className="grant-fields"><label>Student<select name="userId" required value={userId} onChange={(event) => { setUserId(event.target.value); const student = students.find((entry) => entry.id === event.target.value); setRecipientName(student?.name || ''); }}><option value="" disabled>Select a student</option>{students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.email}</option>)}</select></label><label>Completed event<select name="eventId" required value={eventId} onChange={(event) => setEventId(event.target.value)}><option value="" disabled>Select an event</option>{completedEvents.map((event) => <option key={event.id} value={event.id}>{event.title} · {dateLabel(event.date)}</option>)}</select></label><label>Certificate template<select name="templateId" required value={templateId} onChange={(event) => chooseTemplate(event.target.value)}>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select></label><label>Recipient name<input name="recipientName" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} required /></label><label>Certificate title<input name="title" value={title} onChange={(event) => setTitle(event.target.value)} required /></label><label>Organization<input name="organization" value={organization} onChange={(event) => setOrganization(event.target.value)} required /></label><label className="grant-message-field">Certificate message / extra text<textarea name="message" rows="3" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Use {recipient}, {event}, {eventDate}, {hours}, {certificateNumber}, or {dateIssued}." /></label><div className="form-row"><label>Signatory<input name="signatory" value={signatory} onChange={(event) => setSignatory(event.target.value)} required /></label><label>Signatory position<input name="position" value={position} onChange={(event) => setPosition(event.target.value)} required /></label></div></div>{previewCertificate && <div className="grant-preview"><span className="eyebrow">LIVE PREVIEW</span><CertificateArtwork certificate={previewCertificate} /></div>}<div className="grant-submit-row"><small>The saved certificate uses the details shown here and is linked to the selected student.</small><Button disabled={busy}>{busy ? 'Granting…' : 'Grant certificate'}</Button></div></form> : <Empty message="Add a student, a completed event, and a certificate template before issuing a certificate." />}</section>
    <section className="records-panel granted-admin-list"><div className="section-heading"><div><span className="eyebrow">CERTIFICATE RECORD</span><h2>Issued certificates</h2></div><span className="record-count">{certificates.length} issued</span></div>{certificates.length ? <div className="table-scroll"><table><thead><tr><th>RECIPIENT</th><th>EVENT</th><th>TEMPLATE</th><th>CERTIFICATE NO.</th><th>ISSUED</th></tr></thead><tbody>{certificates.map((certificate) => <tr key={certificate.id}><td><b>{certificate.recipientName}</b></td><td>{certificate.eventName}</td><td>{certificate.template.name}</td><td>{certificate.certificateNumber}</td><td>{dateLabel(certificate.issuedAt.slice(0, 10))}</td></tr>)}</tbody></table></div> : <Empty message="Granted certificates will appear here." />}</section>
  </div>;
}
export default function App() { return <BrowserRouter><AuthProvider><AppShell/></AuthProvider></BrowserRouter>; }
