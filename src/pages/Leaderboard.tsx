import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Member } from '../lib/api'
import { profileUrl } from '../lib/codewars'
import { useAsync } from '../lib/useAsync'
import { Avatar, EmptyState, Notice, PageHeader, Spinner } from '../components/ui'
import { timeAgo } from '../lib/time'

const REFRESH_MS = 30_000

interface Ranked extends Member {
  rank: number
}

/** Standard competition ranking: equal points share a rank (1, 1, 3 …). */
function withRanks(members: Member[]): Ranked[] {
  const sorted = [...members].sort((a, b) => b.points - a.points || a.username.localeCompare(b.username))
  const ranked: Ranked[] = []
  sorted.forEach((m, i) => {
    const prev = ranked[i - 1]
    ranked.push({ ...m, rank: prev && prev.points === m.points ? prev.rank : i + 1 })
  })
  return ranked
}

export default function Leaderboard() {
  const { data, error, loading, updatedAt, reload } = useAsync(api.leaderboard, REFRESH_MS)
  const [query, setQuery] = useState('')
  const now = useNow()

  const ranked = useMemo(() => withRanks(data ?? []), [data])
  const filtered = query
    ? ranked.filter((m) => m.username.toLowerCase().includes(query.trim().toLowerCase()))
    : ranked
  const podium = query ? [] : ranked.slice(0, 3)
  const totalPoints = ranked.reduce((s, m) => s + m.points, 0)

  return (
    <>
      <PageHeader
        title="Leaderboard"
        subtitle="Top 20 members ranked by points earned from club katas."
        right={
          <button onClick={() => void reload()} className="flex items-center gap-2 text-xs text-ink-400 hover:text-ink-100">
            <span className="relative flex size-2">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
            </span>
            Live · updated {timeAgo(updatedAt, now)}
          </button>
        }
      />

      {error && !data && (
        <Notice kind="error">
          {error.message}{' '}
          <button className="underline" onClick={() => void reload()}>
            Retry
          </button>
        </Notice>
      )}

      {loading && !data && (
        <div className="flex justify-center py-20 text-ink-400">
          <Spinner className="size-6" />
        </div>
      )}

      {data && ranked.length === 0 && (
        <EmptyState title="No members yet">
          Once an admin adds members, they'll show up here as they solve{' '}
          <Link to="/challenges" className="underline">
            club challenges
          </Link>
          .
        </EmptyState>
      )}

      {ranked.length > 0 && (
        <>
          <div className="mb-8 grid grid-cols-3 gap-3 text-center sm:gap-4">
            <Stat label="Members" value={ranked.length} />
            <Stat label="Total points" value={totalPoints.toLocaleString()} />
            <Stat label="Top score" value={ranked[0].points.toLocaleString()} />
          </div>

          {podium.length > 0 && <Podium members={podium} />}

          <div className="mb-3 mt-10 flex items-center justify-between gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-400">
              {query ? `Results for “${query}”` : 'Rankings'}
            </h2>
            <input
              className="input max-w-56"
              placeholder="Search members…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search members"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-400">No members match “{query}”.</p>
          ) : (
            <ol className="card divide-y divide-ink-700/70 overflow-hidden">
              {filtered.map((m) => (
                <Row key={m.username} member={m} highlight={!query && m.rank <= 3} top={ranked[0].points} />
              ))}
            </ol>
          )}
        </>
      )}
    </>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card px-3 py-4">
      <div className="font-mono text-xl font-bold sm:text-2xl">{value}</div>
      <div className="mt-0.5 text-[11px] uppercase tracking-wide text-ink-400">{label}</div>
    </div>
  )
}

const medal = {
  1: { ring: 'ring-gold', text: 'text-gold', bar: 'from-gold/30' },
  2: { ring: 'ring-silver', text: 'text-silver', bar: 'from-silver/20' },
  3: { ring: 'ring-bronze', text: 'text-bronze', bar: 'from-bronze/20' },
} as const

// Step heights follow podium position; colours and labels follow the real rank, so ties look tied.
const stepHeight = { 1: 'h-32 sm:h-40', 2: 'h-24 sm:h-28', 3: 'h-16 sm:h-20' } as const

const ordinal = (n: number) => `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`

function Podium({ members }: { members: Ranked[] }) {
  // Visual order: 2nd, 1st, 3rd.
  const order = [members[1], members[0], members[2]]
  return (
    <div className="grid grid-cols-3 items-end gap-3 sm:gap-5">
      {order.map((m, i) => {
        if (!m) return <div key={i} />
        const place = (i === 1 ? 1 : i === 0 ? 2 : 3) as 1 | 2 | 3
        const s = medal[Math.min(m.rank, 3) as 1 | 2 | 3]
        return (
          <a
            key={m.username}
            href={profileUrl(m.username)}
            target="_blank"
            rel="noreferrer"
            className="group flex flex-col items-center"
          >
            {m.rank === 1 && <span className="mb-1 text-2xl" aria-hidden>👑</span>}
            <span className={`rounded-full ring-2 ring-offset-4 ring-offset-ink-950 ${s.ring}`}>
              <Avatar name={m.username} size="lg" />
            </span>
            <span className="mt-3 max-w-full truncate text-sm font-semibold group-hover:underline sm:text-base">
              {m.username}
            </span>
            <span className={`font-mono text-sm font-bold ${s.text}`}>{m.points.toLocaleString()} pts</span>
            <div
              className={`mt-3 flex w-full items-start justify-center rounded-t-xl border border-b-0 border-ink-700 bg-gradient-to-b to-transparent pt-3 ${s.bar} ${stepHeight[place]}`}
            >
              <span className={`font-mono text-lg font-black sm:text-2xl ${s.text}`}>{ordinal(m.rank)}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

function Row({ member, highlight, top }: { member: Ranked; highlight: boolean; top: number }) {
  const pct = top > 0 && member.points > 0 ? Math.max(2, (member.points / top) * 100) : 0
  const rankColor =
    member.rank === 1 ? 'text-gold' : member.rank === 2 ? 'text-silver' : member.rank === 3 ? 'text-bronze' : 'text-ink-400'

  return (
    <li className={`flex items-center gap-3 px-4 py-3 sm:gap-4 ${highlight ? 'bg-ink-800/40' : ''}`}>
      <span className={`w-7 text-right font-mono text-sm font-bold ${rankColor}`}>{member.rank}</span>
      <Avatar name={member.username} size="sm" />
      <div className="min-w-0 flex-1">
        <a
          href={profileUrl(member.username)}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-sm font-medium hover:underline"
        >
          {member.username}
        </a>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-700/70">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <span className="w-20 text-right font-mono text-sm font-semibold">
        {member.points.toLocaleString()}
        <span className="ml-1 text-xs font-normal text-ink-400">pts</span>
      </span>
    </li>
  )
}

function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
