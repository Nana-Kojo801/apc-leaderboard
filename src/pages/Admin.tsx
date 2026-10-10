import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { api, ApiError, type Kata, type Member } from '../lib/api'
import { fetchKata, fetchUser, kataUrl, parseKataRef, suggestedPoints, type CodewarsKata } from '../lib/codewars'
import { useAsync } from '../lib/useAsync'
import { useCodewarsKata } from '../lib/useCodewarsKata'
import { Avatar, KyuBadge, Notice, PageHeader, Spinner } from '../components/ui'
import Login from './Login'

type Flash = { kind: 'success' | 'error'; text: string } | null

export default function Admin() {
  const { email } = useAuth()
  return email ? <Dashboard email={email} /> : <Login />
}

function Dashboard({ email }: { email: string }) {
  const { logout, handleAuthError } = useAuth()
  const members = useAsync(api.leaderboard)
  const katas = useAsync(api.katas)
  const [forbidden, setForbidden] = useState(false)

  // Shared handler: surfaces errors and signs out on 401.
  function onError(err: unknown): string {
    handleAuthError(err)
    if (err instanceof ApiError && err.status === 403) setForbidden(true)
    return err instanceof Error ? err.message : 'Something went wrong.'
  }

  return (
    <>
      <PageHeader
        title="Admin dashboard"
        subtitle={
          <>
            Signed in as <span className="text-ink-100">{email}</span>
          </>
        }
        right={
          <button className="btn-ghost" onClick={() => void logout()}>
            Sign out
          </button>
        }
      />

      {forbidden && (
        <div className="mb-6">
          <Notice kind="error">
            This account is signed in but doesn't have the <strong>ADMIN</strong> role, so changes are rejected. Ask
            an executive to upgrade it.
          </Notice>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Members" count={members.data?.length}>
          <AddMemberForm onAdded={members.reload} onError={onError} />
          <MemberList members={members.data} loading={members.loading} onChanged={members.reload} onError={onError} />
          <p className="mt-3 text-xs text-ink-400">
            The server only exposes the top 20 members. To remove someone not listed, use “Remove by username”.
          </p>
          <RemoveByUsername onRemoved={members.reload} onError={onError} />
        </Panel>

        <Panel title="Challenges" count={katas.data?.length}>
          <AddKataForm existing={katas.data ?? []} onAdded={katas.reload} onError={onError} />
          <KataList
            katas={katas.data}
            loading={katas.loading}
            onChanged={() => {
              void katas.reload()
              void members.reload() // removing a kata deducts points
            }}
            onError={onError}
          />
        </Panel>
      </div>
    </>
  )
}

function Panel({ title, count, children }: { title: string; count?: number; children: ReactNode }) {
  return (
    <section className="card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        {title}
        {count != null && <span className="rounded-full bg-ink-700 px-2 py-0.5 text-xs text-ink-300">{count}</span>}
      </h2>
      {children}
    </section>
  )
}

/* ---------------------------------- Members --------------------------------- */

function AddMemberForm({ onAdded, onError }: { onAdded: () => Promise<void>; onError: (e: unknown) => string }) {
  const [username, setUsername] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name) return
    setBusy(true)
    setFlash(null)
    try {
      // Verify the account exists so typos don't end up tracked forever at 0 points.
      const cw = await fetchUser(name)
      if (!cw) {
        setFlash({ kind: 'error', text: `No Codewars user named “${name}”. Check the spelling.` })
        return
      }
      await api.addMember(cw.username)
      setFlash({ kind: 'success', text: `Added ${cw.username} (${cw.ranks.overall.name}, ${cw.honor} honor).` })
      setUsername('')
      await onAdded()
    } catch (err) {
      setFlash({ kind: 'error', text: onError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-2">
      <label className="label" htmlFor="new-member">
        Add member by Codewars username
      </label>
      <div className="flex gap-2">
        <input
          id="new-member"
          className="input"
          placeholder="e.g. g964"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
        />
        <button className="btn-primary shrink-0" disabled={busy || !username.trim()}>
          {busy ? <Spinner /> : 'Add'}
        </button>
      </div>
      {flash && <Notice kind={flash.kind}>{flash.text}</Notice>}
    </form>
  )
}

function MemberList({
  members,
  loading,
  onChanged,
  onError,
}: {
  members?: Member[]
  loading: boolean
  onChanged: () => Promise<void>
  onError: (e: unknown) => string
}) {
  const [error, setError] = useState<string>()

  if (loading && !members) return <ListSkeleton />
  if (!members?.length) return <p className="py-6 text-center text-sm text-ink-400">No members tracked yet.</p>

  return (
    <>
      {error && (
        <div className="mb-2">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <ul className="divide-y divide-ink-700/70 rounded-xl border border-ink-700">
        {members.map((m) => (
          <li key={m.username} className="flex items-center gap-3 px-3 py-2">
            <Avatar name={m.username} size="sm" />
            <span className="min-w-0 flex-1 truncate text-sm">{m.username}</span>
            <span className="font-mono text-xs text-ink-400">{m.points} pts</span>
            <ConfirmButton
              label="Remove"
              onConfirm={async () => {
                setError(undefined)
                try {
                  await api.deleteMember(m.username)
                  await onChanged()
                } catch (err) {
                  setError(onError(err))
                }
              }}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

function RemoveByUsername({ onRemoved, onError }: { onRemoved: () => Promise<void>; onError: (e: unknown) => string }) {
  const [open, setOpen] = useState(false)
  const [username, setUsername] = useState('')
  const [flash, setFlash] = useState<Flash>(null)
  const [busy, setBusy] = useState(false)

  if (!open)
    return (
      <button className="mt-2 text-xs text-ink-400 underline hover:text-ink-100" onClick={() => setOpen(true)}>
        Remove by username
      </button>
    )

  async function submit(e: FormEvent) {
    e.preventDefault()
    const name = username.trim()
    if (!name || !window.confirm(`Stop tracking “${name}”? Their points will be removed from the leaderboard.`)) return
    setBusy(true)
    setFlash(null)
    try {
      await api.deleteMember(name)
      setFlash({ kind: 'success', text: `Removed ${name}.` })
      setUsername('')
      await onRemoved()
    } catch (err) {
      setFlash({ kind: 'error', text: onError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2">
      <div className="flex gap-2">
        <input className="input" placeholder="Exact username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <button className="btn-danger shrink-0" disabled={busy || !username.trim()}>
          {busy ? <Spinner /> : 'Remove'}
        </button>
      </div>
      {flash && <Notice kind={flash.kind}>{flash.text}</Notice>}
    </form>
  )
}

/* ----------------------------------- Katas ---------------------------------- */

const HEX_ID = /^[0-9a-f]{24}$/i

function AddKataForm({
  existing,
  onAdded,
  onError,
}: {
  existing: Kata[]
  onAdded: () => Promise<void>
  onError: (e: unknown) => string
}) {
  const [ref, setRef] = useState('')
  const [lookup, setLookup] = useState<{ state: 'idle' | 'loading' | 'found' | 'missing'; kata?: CodewarsKata }>({
    state: 'idle',
  })
  const [name, setName] = useState('')
  const [points, setPoints] = useState('')
  const [busy, setBusy] = useState(false)
  const [flash, setFlash] = useState<Flash>(null)

  const parsed = parseKataRef(ref)

  // Look the kata up on Codewars as the admin types/pastes (debounced).
  useEffect(() => {
    if (!parsed) {
      setLookup({ state: 'idle' })
      return
    }
    setLookup({ state: 'loading' })
    let alive = true
    const t = window.setTimeout(async () => {
      const kata = await fetchKata(parsed)
      if (!alive) return
      if (kata) {
        setLookup({ state: 'found', kata })
        setName(kata.name)
        setPoints(String(suggestedPoints(kata.rank)))
      } else {
        setLookup({ state: 'missing' })
      }
    }, 400)
    return () => {
      alive = false
      window.clearTimeout(t)
    }
  }, [parsed])

  // The polling worker matches on Codewars' 24-char kata id, so we need the real id, not a slug.
  const remoteId = lookup.kata?.id ?? (HEX_ID.test(parsed) ? parsed : '')
  const duplicate = existing.some((k) => k.kataRemoteId === remoteId)
  const pointsNum = Number(points)
  const canSubmit = !!remoteId && !!name.trim() && Number.isInteger(pointsNum) && pointsNum > 0 && !duplicate && !busy

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    setBusy(true)
    setFlash(null)
    try {
      await api.addKata({
        kataRemoteId: remoteId,
        kataName: name.trim(),
        kataUrl: kataUrl(remoteId),
        pointDifficulty: pointsNum,
      })
      setFlash({ kind: 'success', text: `Now tracking “${name.trim()}” for ${pointsNum} points.` })
      setRef('')
      setName('')
      setPoints('')
      await onAdded()
    } catch (err) {
      setFlash({ kind: 'error', text: onError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mb-4 space-y-3">
      <div>
        <label className="label" htmlFor="kata-ref">
          Codewars kata link or ID
        </label>
        <input
          id="kata-ref"
          className="input font-mono text-xs"
          placeholder="https://www.codewars.com/kata/5277c8a221e209d3f6000b56"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          autoComplete="off"
        />
        <div className="mt-1.5 min-h-5 text-xs">
          {lookup.state === 'loading' && (
            <span className="flex items-center gap-2 text-ink-400">
              <Spinner className="size-3" /> Looking up on Codewars…
            </span>
          )}
          {lookup.state === 'found' && lookup.kata && (
            <span className="flex items-center gap-2 text-emerald-300">
              ✓ Found <KyuBadge rank={lookup.kata.rank} />
              {duplicate && <span className="text-amber-300">— already tracked</span>}
            </span>
          )}
          {lookup.state === 'missing' && (
            <span className="text-amber-300">
              {HEX_ID.test(parsed)
                ? 'Could not reach Codewars — you can still fill in the name manually.'
                : 'No kata found. Paste the full kata link from Codewars.'}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_6.5rem] gap-2">
        <div>
          <label className="label" htmlFor="kata-name">
            Name
          </label>
          <input id="kata-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="label" htmlFor="kata-points">
            Points
          </label>
          <input
            id="kata-points"
            className="input font-mono"
            type="number"
            min={1}
            step={1}
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </div>
      </div>

      <button className="btn-primary w-full" disabled={!canSubmit}>
        {busy && <Spinner />} Track kata
      </button>
      {flash && <Notice kind={flash.kind}>{flash.text}</Notice>}
    </form>
  )
}

function KataList({
  katas,
  loading,
  onChanged,
  onError,
}: {
  katas?: Kata[]
  loading: boolean
  onChanged: () => void
  onError: (e: unknown) => string
}) {
  const [error, setError] = useState<string>()

  if (loading && !katas) return <ListSkeleton />
  if (!katas?.length) return <p className="py-6 text-center text-sm text-ink-400">No katas tracked yet.</p>

  return (
    <>
      {error && (
        <div className="mb-2">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <ul className="divide-y divide-ink-700/70 rounded-xl border border-ink-700">
        {katas.map((k) => (
          <KataRow
            key={k.kataRemoteId}
            kata={k}
            onDelete={async () => {
              setError(undefined)
              try {
                await api.deleteKata(k.kataRemoteId)
                onChanged()
              } catch (err) {
                setError(onError(err))
              }
            }}
          />
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink-400">Removing a kata also deducts its points from everyone who solved it.</p>
    </>
  )
}

function KataRow({ kata, onDelete }: { kata: Kata; onDelete: () => Promise<void> }) {
  const info = useCodewarsKata(kata.kataRemoteId)
  return (
    <li className="flex items-center gap-3 px-3 py-2">
      <span className="w-14 shrink-0">{info !== null && <KyuBadge rank={info?.rank} />}</span>
      <a href={kata.kataUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-sm hover:underline">
        {kata.kataName}
      </a>
      <span className="font-mono text-xs text-gold">+{kata.pointDifficulty}</span>
      <ConfirmButton label="Remove" onConfirm={onDelete} />
    </li>
  )
}

/* ---------------------------------- Shared ---------------------------------- */

function ConfirmButton({ label, onConfirm }: { label: string; onConfirm: () => Promise<void> }) {
  const [armed, setArmed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = window.setTimeout(() => setArmed(false), 3000)
    return () => window.clearTimeout(t)
  }, [armed])

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        if (!armed) return setArmed(true)
        setBusy(true)
        try {
          await onConfirm()
        } finally {
          setBusy(false)
          setArmed(false)
        }
      }}
      className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium transition ${
        armed ? 'bg-red-500/20 text-red-200' : 'text-ink-400 hover:bg-ink-800 hover:text-red-300'
      }`}
    >
      {busy ? <Spinner className="size-3" /> : armed ? 'Confirm?' : label}
    </button>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-11 animate-pulse rounded-lg bg-ink-800" />
      ))}
    </div>
  )
}
