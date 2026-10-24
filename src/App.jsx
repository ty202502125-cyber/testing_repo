import { useEffect, useState } from 'react'
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './context/authHooks'
import workspace from './layouts/campusWeek'
import AppSidebar from './components/AppSidebar'
import AppTopbar from './components/AppTopbar'
import { Button, EmptyState } from './components/ui'
import AuthPage from './pages/AuthPage'
import ActivityFeed from './pages/ActivityFeed'
import ActivityDetail from './pages/ActivityDetail'
import StudentRecords from './pages/StudentRecords'
import AdminActivityManager from './pages/AdminActivityManager'
import CertificateTemplateManager from './pages/CertificateTemplateManager'
import AdminCertificates from './pages/AdminCertificates'
import { usePendingCount } from './hooks/useCampusData'
import './App.css'
import './styles/design-system.css'

function AppShell() {
  const { user, login, register, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const currentPath = location.pathname

  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [dataRevision, setDataRevision] = useState(0)
  const [selectedTheme, setSelectedTheme] = useState(() =>
    localStorage.getItem('campus_theme') || 'light',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = selectedTheme
    localStorage.setItem('campus_theme', selectedTheme)
  }, [selectedTheme])

  useEffect(() => {
    const refreshDataOnChange = () => setDataRevision((current) => current + 1)
    window.addEventListener('campus:records-changed', refreshDataOnChange)

    return () => {
      window.removeEventListener('campus:records-changed', refreshDataOnChange)
    }
  }, [])

  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const closeSidebarOnEscape = (event) => {
      if (event.key === 'Escape') setIsSidebarOpen(false)
    }

    window.addEventListener('keydown', closeSidebarOnEscape)
    return () => window.removeEventListener('keydown', closeSidebarOnEscape)
  }, [isSidebarOpen])

  const showToast = (message) => {
    setToastMessage(message)
    window.setTimeout(() => setToastMessage(''), 4000)
  }

  const defaultDashboardRoute = user?.role === 'admin' ? '/admin' : '/dashboard'

  useEffect(() => {
    if (!user && !['/login', '/register'].includes(currentPath)) {
      navigate('/login')
      return
    }

    if (user && ['/login', '/register', '/'].includes(currentPath)) {
      navigate(defaultDashboardRoute)
    }
  }, [user, currentPath, defaultDashboardRoute, navigate])

  const navigateTo = (route) => {
    setIsSidebarOpen(false)
    navigate(route)
    window.scrollTo(0, 0)
  }

  const toggleApplicationTheme = () => {
    setSelectedTheme((currentTheme) =>
      currentTheme === 'light' ? 'dark' : 'light',
    )
  }

  const isAdminUser = user?.role === 'admin'
  const pendingApprovalCount = usePendingCount(Boolean(user && isAdminUser))

  if (!user) {
    const sharedProps = {
      theme: selectedTheme,
      toggleTheme: toggleApplicationTheme,
      navigate: navigateTo,
    }

    return currentPath === '/register'
      ? (
        <AuthPage
          {...sharedProps}
          mode='register'
          onSubmit={async (values) => {
            const account = await register(values)
            navigateTo(account.role === 'admin' ? '/admin' : '/dashboard')
          }}
        />
      )
      : (
        <AuthPage
          {...sharedProps}
          mode='login'
          onSubmit={async (values) => {
            await login(values.email, values.password)
            navigateTo(values.role === 'admin' ? '/admin' : '/dashboard')
          }}
        />
      )
  }

  const navigationItems = isAdminUser
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
    ]

  const isRouteActive = (baseRoute) =>
    currentPath === baseRoute || currentPath.startsWith(`${baseRoute}/`)

  const currentPageLabel = currentPath.startsWith('/activities/')
    ? 'Activity details'
    : navigationItems.find(([route]) => isRouteActive(route))?.[1] || 'Workspace'

  const isRoleRestrictedRoute =
    (currentPath.startsWith('/admin') && !isAdminUser) ||
    (!currentPath.startsWith('/admin') && isAdminUser)

  return (
    <div className='app app-layout'>
      <a className='skip-link' href='#main-content'>Skip to main content</a>
      <AppSidebar
        user={user}
        admin={isAdminUser}
        navItems={navigationItems}
        pendingCount={pendingApprovalCount}
        isActive={isRouteActive}
        go={navigateTo}
        menuOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={selectedTheme}
        onToggleTheme={toggleApplicationTheme}
        onLogout={() => {
          logout()
          navigateTo('/login')
        }}
        dashboardPath={defaultDashboardRoute}
      />
      <div className='app-column'>
        <AppTopbar
          admin={isAdminUser}
          pageLabel={currentPageLabel}
          user={user}
          menuOpen={isSidebarOpen}
          onToggleMenu={() => setIsSidebarOpen((isOpen) => !isOpen)}
        />
        <main
          id='main-content'
          className='main-content'
          key={`${currentPath}-${dataRevision}`}
          tabIndex='-1'
        >
          {currentPath === '/dashboard' && !isAdminUser && (
            <workspace.StudentOverview
              user={user}
              go={navigateTo}
              notify={showToast}
            />
          )}
          {currentPath === '/activities' && !isAdminUser && (
            <ActivityFeed go={navigateTo} />
          )}
          {currentPath.startsWith('/activities/') && !isAdminUser && (
            <ActivityDetail
              id={currentPath.split('/').pop()}
              go={navigateTo}
              notify={showToast}
              user={user}
              refresh={() => setDataRevision((count) => count + 1)}
            />
          )}
          {currentPath === '/records' && !isAdminUser && (
            <StudentRecords user={user} notify={showToast} />
          )}
          {currentPath === '/admin' && isAdminUser && (
            <workspace.AdminOverview
              focus='dashboard'
              go={navigateTo}
              notify={showToast}
            />
          )}
          {currentPath === '/admin/approvals' && isAdminUser && (
            <workspace.AdminOverview
              focus='approvals'
              go={navigateTo}
              notify={showToast}
            />
          )}
          {currentPath === '/admin/activities' && isAdminUser && (
            <AdminActivityManager notify={showToast} />
          )}
          {currentPath === '/admin/templates' && isAdminUser && (
            <CertificateTemplateManager notify={showToast} />
          )}
          {currentPath === '/admin/certificates' && isAdminUser && (
            <AdminCertificates notify={showToast} />
          )}
          {isRoleRestrictedRoute && (
            <div className='content-wrap'>
              <EmptyState
                title='Not available for this account'
                message='That view belongs to a different role.'
              />
              <Button onClick={() => navigateTo(defaultDashboardRoute)}>
                Go to your dashboard
              </Button>
            </div>
          )}
        </main>
        <footer className='footer'>
          <span>© 2026 Campus Connect</span>
          <span>Small acts. Shared impact.</span>
        </footer>
      </div>
      {toastMessage ? (
        <div className='toast' role='status'>
          {toastMessage}
        </div>
      ) : null}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
