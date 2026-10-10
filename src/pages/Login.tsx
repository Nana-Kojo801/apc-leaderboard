import { useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { api } from '../lib/api'
import { BELTS } from '../lib/belts'
import { BeltStrip, Notice, Spinner } from '../components/ui'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  return (
    <div className="mx-auto grid max-w-[1000px] items-center gap-10 px-4 pt-6 sm:px-8 sm:pt-12 md:grid-cols-[1fr_420px]">
      <div className="hidden md:block">
        <p className="anim-fade-up text-sm font-semibold text-club">Exec area</p>
        <h1 className="display anim-fade-up mt-2 text-[52px] leading-[1.02] font-extrabold" style={{ animationDelay: '80ms' }}>
          Run the dojo.
        </h1>
        <p className="anim-fade-up mt-4 max-w-sm text-[17px] leading-relaxed text-[#4A4E57]" style={{ animationDelay: '160ms' }}>
          Add members, pick the season's katas and set what each one is worth. The board takes care of the rest.
        </p>
        <div className="anim-fade-up mt-8 flex max-w-xs flex-col gap-3" style={{ animationDelay: '240ms' }}>
          {[...BELTS].reverse().filter((_, i) => i % 2 === 0).map((b, i) => (
            <span key={b.kyu} className="anim-slide block" style={{ width: `${100 - i * 14}%`, animationDelay: `${320 + i * 80}ms` }}>
              <BeltStrip belt={b} ring="#F4F5F7" />
            </span>
          ))}
        </div>
      </div>

      <div className="anim-fade-up" style={{ animationDelay: '120ms' }}>
        <div className="mb-6 md:hidden">
          <h1 className="display text-[34px] font-extrabold">Exec area</h1>
          <p className="mt-1 text-muted">Manage members and katas.</p>
        </div>
        <div className="card p-6 shadow-[0_24px_60px_-36px_rgba(21,22,26,.35)] sm:p-7">
          <div className="mb-6 grid grid-cols-2 rounded-full bg-chip p-1 text-sm" role="tablist">
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-10 rounded-full font-semibold transition-all duration-200 ${
                  mode === m ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-[#4A4E57] hover:text-ink'
                }`}
              >
                {m === 'login' ? 'Sign in' : 'Request access'}
              </button>
            ))}
          </div>
          <div key={mode} className="anim-fade-up">
            {mode === 'login' ? <LoginForm /> : <RegisterForm onDone={() => setMode('login')} />}
          </div>
        </div>
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
      <button className="btn-club w-full" disabled={busy}>
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
          Account created for <strong>{email}</strong>. An exec needs to activate it before you can sign in.
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
      <p className="text-[13px] text-muted">New accounts stay inactive until an exec grants admin access.</p>
      {error && <Notice kind="error">{error}</Notice>}
      <button className="btn-club w-full" disabled={busy}>
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
