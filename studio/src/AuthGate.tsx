import { type ReactNode, useEffect, useState } from 'react'

type Session = { access_token: string; user: { email?: string } }
const storageKey = 'studio-auth-session'

export function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => { try { return JSON.parse(localStorage.getItem(storageKey) ?? 'null') as Session | null } catch { return null } })
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (session === null) return
    const originalFetch = window.fetch
    window.fetch = (input, init = {}) => originalFetch(input, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${session.access_token}` } })
    return () => { window.fetch = originalFetch }
  }, [session])
  const authenticate = async (mode: 'signin' | 'signup') => {
    const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
    if (!url || !key) return setMessage('Studio authentication is not configured.')
    setLoading(true); setMessage('')
    try {
      const response = await fetch(`${url}/auth/v1/${mode === 'signin' ? 'token?grant_type=password' : 'signup'}`, { method: 'POST', headers: { apikey: key, 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
      const payload = await response.json() as Session & { message?: string }
      if (!response.ok || !payload.access_token) throw new Error(payload.message ?? 'Authentication failed. Confirm your email, then sign in.')
      localStorage.setItem(storageKey, JSON.stringify(payload)); setSession(payload)
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Authentication failed.') } finally { setLoading(false) }
  }
  if (session !== null) return <><button className="studio-signout" type="button" onClick={() => { localStorage.removeItem(storageKey); setSession(null) }}>Sign out {session.user.email ?? ''}</button>{children}</>
  return <main className="studio-auth"><p className="eyebrow">OpenAPI-to-MCP Studio</p><h1>Sign in to your workspace</h1><p>Projects are private to your Studio account.</p><label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label><button type="button" disabled={loading || !email || password.length < 8} onClick={() => void authenticate('signin')}>{loading ? 'Signing in...' : 'Sign in'}</button><button className="secondary" type="button" disabled={loading || !email || password.length < 8} onClick={() => void authenticate('signup')}>Create account</button><p>{message}</p></main>
}
