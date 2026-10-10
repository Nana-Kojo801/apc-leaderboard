import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { api } from '../lib/api'
import { Notice, Spinner } from '../components/ui'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="mx-auto max-w-sm pt-4 sm:pt-10">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Admin access</h1>
        <p className="mt-1 text-sm text-ink-400">Manage tracked members and challenges.</p>
      </div>

      <div className="card p-6">
        <div className="mb-6 grid grid-cols-2 rounded-lg bg-ink-800 p-1 text-sm">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-md py-1.5 font-medium transition ${
                mode === m ? 'bg-ink-600 text-ink-100 shadow' : 'text-ink-400 hover:text-ink-100'
              }`}
            >
              {m === 'login' ? 'Sign in' : 'Request access'}
            </button>
          ))}
        </div>
        {mode === 'login' ? <LoginForm /> : <RegisterForm onDone={() => setMode('login')} />}
      </div>
    </div>
  )
}

function LoginForm() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(undefined)
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password">
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <Notice kind="error">{error}</Notice>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy && <Spinner />} Sign in
      </button>
    </form>
  )
}

function RegisterForm({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const [done, setDone] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setBusy(true)
    setError(undefined)
    try {
      await api.register(email.trim(), password)
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Notice kind="success">
          Account created for <strong>{email}</strong>. A club executive needs to activate it before you can sign in.
        </Notice>
        <button type="button" className="btn-ghost w-full" onClick={onDone}>
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">
        <input className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Password">
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      <Field label="Confirm password">
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>
      <p className="text-xs text-ink-400">New accounts start inactive until an executive grants admin access.</p>
      {error && <Notice kind="error">{error}</Notice>}
      <button className="btn-primary w-full" disabled={busy}>
        {busy && <Spinner />} Create account
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}
