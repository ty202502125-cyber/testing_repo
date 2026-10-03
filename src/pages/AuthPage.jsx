import { useState } from 'react';
import { Button, ThemeToggle } from '../components/ui';
import { store } from '../services/api';

/**
 * Sign in / create account.
 *
 * The left panel states one figure that comes from the real published data, so
 * nothing on this screen claims credibility it cannot back up.
 */
export default function AuthPage({ mode, onSubmit, navigate, theme, toggleTheme }) {
  const registerMode = mode === 'register';
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const activities = store.read('campus_activities', []);
  const open = activities.filter((item) => item.status === 'open');
  const openPlaces = open.reduce((total, item) => total + Number(item.spotsAvailable || 0), 0);

  async function submit(event) {
    event.preventDefault();
    setError('');
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (!/^\S+@\S+\.\S+$/.test(data.email)) return setError('Enter a valid email address.');
    if (data.password.length < 8 || !/[A-Z]/.test(data.password) || !/[0-9]/.test(data.password)) {
      return setError('Use 8+ characters, including one uppercase letter and one number.');
    }
    if (registerMode && data.password !== data.confirm) return setError('Your passwords do not match.');
    setBusy(true);
    try {
      await onSubmit({ ...data, role });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
    return undefined;
  }

  return (
    <div className="auth-layout">
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <aside className="auth-aside">
        <button className="brand inverse" onClick={() => navigate('/login')}>
          <span className="brand-mark">C</span>
          <span>
            Campus<span className="brand-light"> Connect</span>
            <small>STUDENT COMMUNITY</small>
          </span>
        </button>
        <div className="auth-quote">
          <h1>
            Do good.
            <br />
            <em>Feel good.</em>
          </h1>
          <p>Find your people, show up for your community, and turn a few hours into a lasting impact.</p>
          <div className="quote-stat">
            <b>{openPlaces}</b>
            <span>
              places still open across {open.length} {open.length === 1 ? 'activity' : 'activities'} published for Fall 2026
            </span>
          </div>
        </div>
        <div className="aside-footer">Campus Connect · Student volunteer community</div>
      </aside>
      <section className="auth-main">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand-mark">C</span> Campus Connect
          </div>
          <h2>{registerMode ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-subtitle">
            {registerMode ? 'Join a campus full of people who care.' : 'Pick up where your good work left off.'}
          </p>
          <form onSubmit={submit} className="form-stack">
            {registerMode && (
              <>
                <label>
                  Full name
                  <input name="name" autoComplete="name" placeholder="e.g. Maya Santos" required />
                </label>
                <div className="role-toggle" role="radiogroup" aria-label="Account type">
                  <button type="button" className={role === 'student' ? 'active' : ''} onClick={() => setRole('student')}>Student</button>
                  <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>Admin</button>
                </div>
                <label>
                  Department
                  <input name="department" placeholder="e.g. Environmental Science" required />
                </label>
              </>
            )}
            <label>
              School email
              <input name="email" type="email" autoComplete="email" defaultValue={registerMode ? '' : 'maya@campus.edu'} placeholder="you@campus.edu" required />
            </label>
            <label>
              Password
              <input name="password" type="password" autoComplete={registerMode ? 'new-password' : 'current-password'} defaultValue={registerMode ? '' : 'Campus123!'} placeholder="At least 8 characters" required />
            </label>
            {registerMode && (
              <label>
                Confirm password
                <input name="confirm" type="password" autoComplete="new-password" placeholder="Re-enter your password" required />
              </label>
            )}
            {error ? <div className="form-error" role="alert">{error}</div> : null}
            <Button disabled={busy} className="auth-submit">
              {busy ? 'Please wait…' : registerMode ? 'Create account' : 'Sign in'}
            </Button>
          </form>
          {!registerMode && (
            <div className="demo-hint">
              <b>Demo access</b>
              <span>Student: maya@campus.edu · Admin: admin@campus.edu</span>
              <span>Password for both: <strong>Campus123!</strong></span>
            </div>
          )}
          <p className="auth-switch">
            {registerMode ? 'Already part of the community?' : 'New around here?'}{' '}
            <button onClick={() => navigate(registerMode ? '/login' : '/register')}>
              {registerMode ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
        <div className="auth-legal">
          By continuing you agree to the Campus Connect community guidelines and privacy policy.
        </div>
      </section>
    </div>
  );
}
