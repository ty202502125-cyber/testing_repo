import { useEffect, useState } from 'react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/authHooks';
import workspace from './layouts/campusWeek';
import AppSidebar from './components/AppSidebar';
import AppTopbar from './components/AppTopbar';
import { Button, EmptyState } from './components/ui';
import AuthPage from './pages/AuthPage';
import ActivityFeed from './pages/ActivityFeed';
import ActivityDetail from './pages/ActivityDetail';
import StudentRecords from './pages/StudentRecords';
import AdminActivityManager from './pages/AdminActivityManager';
import CertificateTemplateManager from './pages/CertificateTemplateManager';
import AdminCertificates from './pages/AdminCertificates';
import { usePendingCount } from './hooks/useCampusData';
import './App.css';
import './styles/design-system.css';

function AppShell() {
  const { user, login, register, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [revision, setRevision] = useState(0);
  const [theme, setTheme] = useState(() => localStorage.getItem('campus_theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('campus_theme', theme);
  }, [theme]);

  // The review queue writes through the service layer; when a record changes we
  // bump the revision so every count on screen is recomputed from stored data.
  useEffect(() => {
    const onChange = () => setRevision((current) => current + 1);
    window.addEventListener('campus:records-changed', onChange);
    return () => window.removeEventListener('campus:records-changed', onChange);
  }, []);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [menuOpen]);

  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 4000);
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : '/dashboard';

  useEffect(() => {
    if (!user && !['/login', '/register'].includes(path)) navigate('/login');
    else if (user && ['/login', '/register', '/'].includes(path)) navigate(dashboardPath);
  }, [user, path, dashboardPath, navigate]);

  const go = (to) => {
    setMenuOpen(false);
    navigate(to);
    window.scrollTo(0, 0);
  };

  const toggleTheme = () => setTheme((current) => (current === 'light' ? 'dark' : 'light'));

  const admin = user?.role === 'admin';
  // Hooks must run before the signed-out early return, so this stays here.
  const pendingCount = usePendingCount(Boolean(user && admin));

  if (!user) {
    const shared = { theme, toggleTheme, navigate: go };
    return path === '/register' ? (
      <AuthPage
        {...shared}
        mode="register"
        onSubmit={async (values) => {
          const account = await register(values);
          go(account.role === 'admin' ? '/admin' : '/dashboard');
        }}
      />
    ) : (
      <AuthPage
        {...shared}
        mode="login"
        onSubmit={async (values) => {
          await login(values.email, values.password);
          go(values.role === 'admin' ? '/admin' : '/dashboard');
        }}
      />
    );
  }

  const navItems = admin
    ? [
        ['/admin', 'Dashboard', 'home'],
        ['/admin/activities', 'Manage activities', 'manage'],
        ['/admin/approvals', 'Hours approvals', 'approvals'],
        ['/admin/certificates', 'Certificates', 'award'],
        ['/admin/templates', 'Templates', 'records'],
      ]
    : [
        ['/dashboard', 'Overview', 'home'],
        ['/activities', 'Discover activities', 'discover'],
        ['/records', 'My service record', 'records'],
      ];

  const isActive = (base) => path === base || path.startsWith(`${base}/`);
  const pageLabel = path.startsWith('/activities/')
    ? 'Activity details'
    : navItems.find(([to]) => isActive(to))?.[1] || 'Workspace';
  const unavailable = (path.startsWith('/admin') && !admin) || (!path.startsWith('/admin') && admin);

  return (
    <div className="app app-layout">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <AppSidebar
        user={user}
        admin={admin}
        navItems={navItems}
        pendingCount={pendingCount}
        isActive={isActive}
        go={go}
        menuOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogout={() => {
          logout();
          go('/login');
        }}
        dashboardPath={dashboardPath}
      />
      <div className="app-column">
        <AppTopbar
          admin={admin}
          pageLabel={pageLabel}
          user={user}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((open) => !open)}
        />
        <main id="main-content" className="main-content" key={`${path}-${revision}`} tabIndex="-1">
          {path === '/dashboard' && !admin && <workspace.StudentOverview user={user} go={go} notify={notify} />}
          {path === '/activities' && !admin && <ActivityFeed go={go} />}
          {path.startsWith('/activities/') && !admin && (
            <ActivityDetail id={path.split('/').pop()} go={go} notify={notify} user={user} refresh={() => setRevision((n) => n + 1)} />
          )}
          {path === '/records' && !admin && <StudentRecords user={user} notify={notify} />}
          {path === '/admin' && admin && <workspace.AdminOverview focus="dashboard" go={go} notify={notify} />}
          {path === '/admin/approvals' && admin && <workspace.AdminOverview focus="approvals" go={go} notify={notify} />}
          {path === '/admin/activities' && admin && <AdminActivityManager notify={notify} />}
          {path === '/admin/templates' && admin && <CertificateTemplateManager notify={notify} />}
          {path === '/admin/certificates' && admin && <AdminCertificates notify={notify} />}
          {unavailable && (
            <div className="content-wrap">
              <EmptyState title="Not available for this account" message="That view belongs to a different role." />
              <Button onClick={() => go(dashboardPath)}>Go to your dashboard</Button>
            </div>
          )}
        </main>
        <footer className="footer">
          <span>© 2026 Campus Connect</span>
          <span>Small acts. Shared impact.</span>
        </footer>
      </div>
      {toast ? <div className="toast" role="status">{toast}</div> : null}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
