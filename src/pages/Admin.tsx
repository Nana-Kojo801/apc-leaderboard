import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useAuth } from '../auth'
import { api, ApiError, type Kata, type Member } from '../lib/api'
import { fetchKata, fetchUser, kataUrl, parseKataRef, suggestedPoints, type CodewarsKata } from '../lib/codewars'
import { useAsync } from '../lib/useAsync'
import { useCodewarsKata } from '../lib/useCodewarsKata'
import { beltFor } from '../lib/belts'
import { Avatar, BeltChip, KyuBadge, Notice, Spinner } from '../components/ui'
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
    <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pt-6 pb-8 sm:pt-12">
        <div>
          <p className="anim-fade-up text-sm font-semibold text-club">Exec area</p>
          <h1 className="display anim-fade-up mt-2 text-[clamp(34px,4.5vw,52px)] leading-[1.02] font-extrabold" style={{ animationDelay: '80ms' }}>
            Dojo admin
          </h1>
          <p className="anim-fade-up mt-2 text-muted" style={{ animationDelay: '140ms' }}>
            Signed in as <span className="font-semibold text-ink">{email}</span>
          </p>
        </div>
        <button className="btn-ghost anim-fade-up" style={{ animationDelay: '200ms' }} onClick={() => void logout()}>
          Sign out
        </button>
      </div>

      {forbidden && (
        <div className="mb-6">
          <Notice kind="error">
            This account is signed in but doesn't have the <strong>ADMIN</strong> role, so changes are rejected. Ask
            an executive to upgrade it.
          </Notice>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel title="Members" count={members.data?.length} delay={120}>
          <AddMemberForm onAdded={members.reload} onError={onError} />
          <MemberList members={members.data} loading={members.loading} onChanged={members.reload} onError={onError} />
          <p className="mt-3 text-[13px] text-muted">
            The server only exposes the top 20 members. To remove someone not listed, use “Remove by username”.
          </p>
          <RemoveByUsername onRemoved={members.reload} onError={onError} />
        </Panel>

        <Panel title="Katas" count={katas.data?.length} delay={220}>
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
    </div>
  )
}

function Panel({ title, count, delay = 0, children }: { title: string; count?: number; delay?: number; children: ReactNode }) {
  return (
    <section className="card anim-fade-up p-5 sm:p-6" style={{ animationDelay: `${delay}ms` }}>
      <h2 className="display mb-5 flex items-center gap-2.5 text-2xl font-extrabold">
        {title}
        {count != null && <span className="rounded-full bg-chip px-2.5 py-0.5 font-sans text-xs font-bold tracking-normal text-ink-2">{count}</span>}
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
        <button className="btn-ink shrink-0 rounded-xl" disabled={busy || !username.trim()}>
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
  if (!members?.length) return <p className="py-8 text-center text-sm text-muted">No members tracked yet.</p>

  return (
    <>
      {error && (
        <div className="mb-2">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line">
        {members.map((m) => (
          <li key={m.username} className="anim-fade-up flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#FAFBFC]">
            <Avatar name={m.username} size="sm" />
            <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">{m.username}</span>
            <span className="hidden sm:inline">
              <BeltChip belt={beltFor(m.points).belt} />
            </span>
            <span className="text-[13px] font-semibold text-muted">{m.points} pts</span>
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
      <button className="mt-2 text-[13px] font-semibold text-ink-2 underline underline-offset-2 hover:text-club" onClick={() => setOpen(true)}>
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
        <button className="btn shrink-0 rounded-xl border border-[#F3C4C0] text-club hover:bg-[#FDF0EF]" disabled={busy || !username.trim()}>
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
          className="input font-mono text-[13px]"
          placeholder="https://www.codewars.com/kata/5277c8a221e209d3f6000b56"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          autoComplete="off"
        />
        <div className="mt-2 min-h-6 text-[13px]">
          {lookup.state === 'loading' && (
            <span className="flex items-center gap-2 text-muted">
              <Spinner className="size-3" /> Looking up on Codewars…
            </span>
          )}
          {lookup.state === 'found' && lookup.kata && (
            <span className="anim-fade-up flex items-center gap-2 font-semibold text-[#1F6B43]">
              ✓ Found <KyuBadge rank={lookup.kata.rank} />
              {duplicate && <span className="font-semibold text-[#8A5A00]">— already tracked</span>}
            </span>
          )}
          {lookup.state === 'missing' && (
            <span className="font-semibold text-[#8A5A00]">
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

      <button className="btn-club w-full" disabled={!canSubmit}>
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
  if (!katas?.length) return <p className="py-8 text-center text-sm text-muted">No katas tracked yet.</p>

  return (
    <>
      {error && (
        <div className="mb-2">
          <Notice kind="error">{error}</Notice>
        </div>
      )}
      <ul className="divide-y divide-line-soft overflow-hidden rounded-2xl border border-line">
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
      <p className="mt-3 text-[13px] text-muted">Removing a kata also deducts its points from everyone who solved it.</p>
    </>
  )
}

function KataRow({ kata, onDelete }: { kata: Kata; onDelete: () => Promise<void> }) {
  const info = useCodewarsKata(kata.kataRemoteId)
  return (
    <li className="anim-fade-up flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-[#FAFBFC]">
      <span className="w-[72px] shrink-0">{info !== null && <KyuBadge rank={info?.rank} />}</span>
      <a href={kata.kataUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-[15px] font-semibold hover:underline">
        {kata.kataName}
      </a>
      <span className="display text-base font-extrabold text-club">+{kata.pointDifficulty}</span>
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
      className={`min-h-9 shrink-0 rounded-full px-3 text-[13px] font-semibold transition-all duration-200 ${
        armed ? 'bg-club text-white' : 'text-muted hover:bg-[#FDF0EF] hover:text-club'
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
        <div key={i} className="skeleton h-12 rounded-xl" />
      ))}
    </div>
  )
}
