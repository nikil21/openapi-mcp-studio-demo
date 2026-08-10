import { createContext, type ReactNode, useContext, useState } from 'react'

type Session = { access_token: string; user: { email?: string } }
type AuthMode = 'signin' | 'signup'
const storageKey = 'studio-auth-session'
const AuthContext = createContext<{ apiFetch: typeof fetch } | null>(null)

export function useStudioAuth() {
  const context = useContext(AuthContext)
  if (context === null) throw new Error('Studio authentication is unavailable.')
  return context
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => { try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Session | null } catch { return null } })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>('signin')
  const isSignUp = mode === 'signup'
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setMessage('')
  }
  const authenticate = async () => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
    if (!url || !key) return setMessage('Studio authentication is not configured.')
    setLoading(true); setMessage('')
    try {
      const response = await fetch(`${url}/auth/v1/${mode === 'signin' ? 'token?grant_type=password' : 'signup'}`, { method: 'POST', headers: { apikey: key, 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const payload = await response.json() as Session & { message?: string }
      if (mode === 'signup' && response.ok && !payload.access_token) {
        setMode('signin')
        return setMessage('Check your inbox to confirm your email, then sign in with the same password.')
      }
      if (!response.ok || !payload.access_token) {
        if (mode === 'signin') throw new Error('We could not sign in with that email and password. If this is your first visit, create an account.')
        if (payload.message?.toLowerCase().includes('already registered')) throw new Error('An account already exists for this email. Sign in instead.')
        throw new Error(payload.message ?? 'We could not create your account. Please try again.')
      }
      localStorage.setItem(storageKey, JSON.stringify(payload)); setSession(payload)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed.') } finally { setLoading(false) }
  }
  if (session !== null) {
    const apiFetch: typeof fetch = (input, init = {}) => fetch(input, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${session.access_token}` } })
    return <AuthContext.Provider value={{ apiFetch }}><div className="studio-account"><span>{session.user.email ?? 'Signed in'}</span><button type="button" onClick={() => { localStorage.removeItem(storageKey); setSession(null) }}>Sign out</button></div>{children}</AuthContext.Provider>
  }
  return <main className="studio-auth">
    <div className="studio-auth-heading">
      <p className="eyebrow">Configurable MCP App Builder</p>
      <h1>{isSignUp ? 'Create your workspace' : 'Welcome back'}</h1>
      <p>{isSignUp ? 'Start with a private workspace for configuring and publishing your MCP App.' : 'Sign in to continue working on your private MCP App projects.'}</p>
    </div>
    <form onSubmit={(event) => { event.preventDefault(); void authenticate() }}>
      <label>Email<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
      <label>Password<input autoComplete={isSignUp ? 'new-password' : 'current-password'} minLength={8} type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      {isSignUp && <p className="auth-hint">Use at least 8 characters. We will email you a confirmation link before you sign in.</p>}
      <button type="submit" disabled={loading || !email || password.length < 8}>{loading ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create account' : 'Sign in')}</button>
    </form>
    <p className="auth-switch">{isSignUp ? 'Already have an account?' : 'First time here?'} <button className="auth-link" type="button" onClick={() => switchMode(isSignUp ? 'signin' : 'signup')}>{isSignUp ? 'Sign in' : 'Create an account'}</button></p>
    {message && <p aria-live="polite" className="auth-message">{message}</p>}
  </main>
}
