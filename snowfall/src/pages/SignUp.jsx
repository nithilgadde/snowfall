import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Snowflake, Mail, Lock, User, ArrowRight, Loader, Check } from 'lucide-react'

export default function SignUp() {
  const navigate = useNavigate()
  const { signUp } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const passwordStrength = () => {
    if (password.length === 0) return null
    if (password.length < 6) return { level: 'weak', text: 'Too short' }
    if (password.length < 8) return { level: 'fair', text: 'Fair' }
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { level: 'strong', text: 'Strong' }
    }
    return { level: 'fair', text: 'Add variety' }
  }

  const strength = passwordStrength()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await signUp(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-ambient">
        <div className="ambient-orb ambient-orb-1" />
        <div className="ambient-orb ambient-orb-2" />
        <div className="ambient-orb ambient-orb-3" />
      </div>

      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <Link to="/" className="auth-logo">
              <div className="auth-logo-icon">
                <Snowflake size={28} />
              </div>
              <span>Snowfall</span>
            </Link>
            <h1>Start learning</h1>
            <p>Create your account to begin</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="auth-error">
                {error}
              </div>
            )}

            <div className="auth-field">
              <label htmlFor="name">Full name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className="auth-input-wrapper">
                <Mail size={18} className="auth-input-icon" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="auth-input-wrapper">
                <Lock size={18} className="auth-input-icon" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  required
                  autoComplete="new-password"
                />
              </div>
              {strength && (
                <div className="password-strength">
                  <div className={`strength-bar strength-${strength.level}`}>
                    <div />
                    <div />
                    <div />
                  </div>
                  <span className={`strength-text strength-${strength.level}`}>
                    {strength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="auth-terms">
              <p>
                By signing up, you agree to our{' '}
                <a href="#">Terms of Service</a> and{' '}
                <a href="#">Privacy Policy</a>
              </p>
            </div>

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? (
                <Loader size={20} className="spin" />
              ) : (
                <>
                  <span>Create account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/signin">Sign in</Link>
            </p>
          </div>
        </div>

        <div className="auth-features">
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Check size={16} />
            </div>
            <span>AI-powered tutoring</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Check size={16} />
            </div>
            <span>Practice exercises</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Check size={16} />
            </div>
            <span>Add your own sources</span>
          </div>
          <div className="auth-feature">
            <div className="auth-feature-icon">
              <Check size={16} />
            </div>
            <span>Multiple subjects</span>
          </div>
        </div>
      </div>
    </div>
  )
}
