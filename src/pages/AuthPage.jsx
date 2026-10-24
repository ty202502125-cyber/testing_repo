import { useState } from 'react'
import { Button, ThemeToggle } from '../components/ui'
import { store } from '../services/api'

/**
 * Sign in / create account.
 *
 * The left panel states one figure that comes from the real published data, so
 * nothing on this screen claims credibility it cannot back up.
 */
export default function AuthPage(
  { mode, onSubmit, navigate, theme, toggleTheme },
) {
  const isRegistrationMode = mode === 'register'
  const [selectedRole, setSelectedRole] = useState('student')
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const publishedActivities = store.read('campus_activities', [])
  const openActivities = publishedActivities.filter((item) => item.status === 'open')
  const availableVolunteerSpots = openActivities.reduce(
    (total, item) => total + Number(item.spotsAvailable || 0),
    0,
  )

  async function handleSubmit(event) {
    event.preventDefault()
    setFormError('')

    const formData = Object.fromEntries(new FormData(event.currentTarget))

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setFormError('Enter a valid email address.')
      return undefined
    }

    if (
      formData.password.length < 8 ||
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password)
    ) {
      setFormError(
        'Use 8+ characters, including one uppercase letter and one number.',
      )
      return undefined
    }

    if (isRegistrationMode && formData.password !== formData.confirm) {
      setFormError('Your passwords do not match.')
      return undefined
    }

    setIsSubmitting(true)

    try {
      await onSubmit({ ...formData, role: selectedRole })
    } catch (error) {
      setFormError(error.message)
      setIsSubmitting(false)
    }

    return undefined
  }

  return (
    <div className='auth-layout'>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <aside className='auth-aside'>
        <button className='brand inverse' onClick={() => navigate('/login')}>
          <span className='brand-mark'>C</span>
          <span>
            Campus<span className='brand-light'>Connect</span>
            <small>STUDENT COMMUNITY</small>
          </span>
        </button>
        <div className='auth-quote'>
          <h1>
            Do good.
            <br />
            <em>Feel good.</em>
          </h1>
          <p>
            Find your people, show up for your community, and turn a few hours
            into a lasting impact.
          </p>
          <div className='quote-stat'>
            <b>{availableVolunteerSpots}</b>
            <span>
              places still open across {openActivities.length}{' '}
              {openActivities.length === 1 ? 'activity' : 'activities'}{' '}
              published for Fall 2026
            </span>
          </div>
        </div>
        <div className='aside-footer'>
          Campus Connect · Student volunteer community
        </div>
      </aside>
      <section className='auth-main'>
        <div className='auth-card'>
          <div className='auth-mobile-brand'>
            <span className='brand-mark'>C</span> Campus Connect
          </div>
          <h2>{isRegistrationMode ? 'Create your account' : 'Welcome back'}</h2>
          <p className='auth-subtitle'>
            {isRegistrationMode
              ? 'Join a campus full of people who care.'
              : 'Pick up where your good work left off.'}
          </p>
          <form onSubmit={handleSubmit} className='form-stack'>
            {isRegistrationMode && (
              <>
                <label>
                  Full name
                  <input
                    name='name'
                    autoComplete='name'
                    placeholder='e.g. Maya Santos'
                    required
                  />
                </label>
                <div
                  className='role-toggle'
                  role='radiogroup'
                  aria-label='Account type'
                >
                  <button
                    type='button'
                    className={selectedRole === 'student' ? 'active' : ''}
                    onClick={() => setSelectedRole('student')}
                  >
                    Student
                  </button>
                  <button
                    type='button'
                    className={selectedRole === 'admin' ? 'active' : ''}
                    onClick={() => setSelectedRole('admin')}
                  >
                    Admin
                  </button>
                </div>
                <label>
                  Department
                  <input
                    name='department'
                    placeholder='e.g. Environmental Science'
                    required
                  />
                </label>
              </>
            )}
            <label>
              School email
              <input
                name='email'
                type='email'
                autoComplete='email'
                defaultValue={isRegistrationMode ? '' : 'maya@campus.edu'}
                placeholder='you@campus.edu'
                required
              />
            </label>
            <label>
              Password
              <input
                name='password'
                type='password'
                autoComplete={isRegistrationMode
                  ? 'new-password'
                  : 'current-password'}
                defaultValue={isRegistrationMode ? '' : 'Campus123!'}
                placeholder='At least 8 characters'
                required
              />
            </label>
            {isRegistrationMode && (
              <label>
                Confirm password
                <input
                  name='confirm'
                  type='password'
                  autoComplete='new-password'
                  placeholder='Re-enter your password'
                  required
                />
              </label>
            )}
            {formError ? (
              <div className='form-error' role='alert'>
                {formError}
              </div>
            ) : null}
            <Button disabled={isSubmitting} className='auth-submit'>
              {isSubmitting
                ? 'Please wait…'
                : isRegistrationMode
                ? 'Create account'
                : 'Sign in'}
            </Button>
          </form>
          {!isRegistrationMode && (
            <div className='demo-hint'>
              <b>Demo access</b>
              <span>Student: maya@campus.edu · Admin: admin@campus.edu</span>
              <span>
                Password for both: <strong>Campus123!</strong>
              </span>
            </div>
          )}
          <p className='auth-switch'>
            {isRegistrationMode
              ? 'Already part of the community?'
              : 'New around here?'}{' '}
            <button
              onClick={() => navigate(isRegistrationMode ? '/login' : '/register')}
            >
              {isRegistrationMode ? 'Sign in' : 'Create an account'}
            </button>
          </p>
        </div>
        <div className='auth-legal'>
          By continuing you agree to the Campus Connect community guidelines and
          privacy policy.
        </div>
      </section>
    </div>
  )
}
