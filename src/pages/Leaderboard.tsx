import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Member } from '../lib/api'
import { BELTS, beltFor, beltRange, beltStyle, type BeltColor, type BeltProgress } from '../lib/belts'
import { profileUrl } from '../lib/codewars'
import { useCountUp, useInView } from '../lib/motion'
import { timeAgo } from '../lib/time'
import { useAsync } from '../lib/useAsync'
import KataCard, { KataCardSkeleton } from '../components/KataCard'
import Reveal from '../components/Reveal'
import { Avatar, BeltChip, BeltStrip, EmptyState, Notice, Progress, SectionHeader } from '../components/ui'

const REFRESH_MS = 30_000

export interface RankedMember extends Member {
  rank: number
  progress: BeltProgress
}

/** Standard competition ranking (1, 1, 3 …) plus each member's belt. */
function rankMembers(members: Member[]): RankedMember[] {
  const sorted = [...members].sort((a, b) => b.points - a.points || a.username.localeCompare(b.username))
  const out: RankedMember[] = []
  sorted.forEach((m, i) => {
    const prev = out[i - 1]
    out.push({ ...m, rank: prev && prev.points === m.points ? prev.rank : i + 1, progress: beltFor(m.points) })
  })
  return out
}

/** Points gained by each member since the previous poll, for the "+N" flash. */
function useGains(members: Member[] | undefined) {
  const prev = useRef<Map<string, number> | null>(null)
  const [gains, setGains] = useState<Record<string, { n: number; key: number }>>({})

  useEffect(() => {
    if (!members) return
    const next = new Map(members.map((m) => [m.username, m.points]))
    if (prev.current) {
      const fresh: Record<string, { n: number; key: number }> = {}
      for (const [name, pts] of next) {
        const before = prev.current.get(name)
        if (before != null && pts > before) fresh[name] = { n: pts - before, key: Date.now() }
      }
      if (Object.keys(fresh).length) setGains((g) => ({ ...g, ...fresh }))
    }
    prev.current = next
  }, [members])

  return gains
}

export default function Leaderboard() {
  const board = useAsync(api.leaderboard, REFRESH_MS)
  const katas = useAsync(api.katas, 60_000)
  const ranked = useMemo(() => rankMembers(board.data ?? []), [board.data])
  const totalPoints = ranked.reduce((s, m) => s + m.points, 0)

  return (
    <>
      <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
        <Hero
          members={board.data ? ranked.length : undefined}
          points={board.data ? totalPoints : undefined}
          katas={katas.data?.length}
          ranked={ranked}
          loading={board.loading && !board.data}
        />

        <Board
          ranked={ranked}
          loading={board.loading && !board.data}
          error={board.error && !board.data ? board.error.message : undefined}
          retry={board.reload}
          updatedAt={board.updatedAt}
          raw={board.data}
        />

        <section className="pt-16 sm:pt-20" aria-label="Katas">
          <Reveal>
            <SectionHeader
              title="Katas this season"
              subtitle={
                katas.data?.length
                  ? `${katas.data.reduce((s, k) => s + k.pointDifficulty, 0).toLocaleString()} points open · solve on Codewars, each counts once`
                  : 'The challenges that earn points on the board.'
              }
              right={
                <Link to="/katas" className="btn-ghost">
                  All katas
                </Link>
              }
            />
          </Reveal>
          {katas.loading && !katas.data ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <KataCardSkeleton key={i} />
              ))}
            </div>
          ) : katas.data?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {katas.data.slice(0, 3).map((k, i) => (
                <Reveal key={k.kataRemoteId} delay={i * 90}>
                  <KataCard kata={k} />
                </Reveal>
              ))}
            </div>
          ) : (
            <EmptyState title="No katas yet">An exec hasn't added this season's katas. Check back soon.</EmptyState>
          )}
        </section>

        <HowItWorks />
      </div>
    </>
  )
}

/* ---------------------------------- Hero ---------------------------------- */

function Hero({
  members,
  points,
  katas,
  ranked,
  loading,
}: {
  members?: number
  points?: number
  katas?: number
  ranked: RankedMember[]
  loading: boolean
}) {
  return (
    <section className="flex flex-wrap items-center gap-10 pt-6 pb-4 sm:pt-12">
      <div className="min-w-0 flex-[1_1_480px]">
        <h1 className="display text-[clamp(42px,5.6vw,68px)] leading-[1] font-extrabold">
          <span className="anim-fade-up block" style={{ animationDelay: '60ms' }}>
            Train on katas.
          </span>
          <span className="anim-fade-up block text-club" style={{ animationDelay: '180ms' }}>
            Climb the belts.
          </span>
        </h1>
        <p className="anim-fade-up mt-5 max-w-[520px] text-[17px] leading-relaxed text-[#4A4E57] sm:text-lg" style={{ animationDelay: '300ms' }}>
          APC tracks your Codewars solves on the club's chosen katas. Every solve earns points, points move you up the
          belts, and the best climbers top the board.
        </p>
        <div className="anim-fade-up mt-7 flex flex-wrap gap-3" style={{ animationDelay: '420ms' }}>
          <Link to="/katas" className="btn-club max-sm:flex-1">
            See this season's katas
          </Link>
          <Link to="/#how" className="btn-ghost max-sm:flex-1">
            How ranking works
          </Link>
        </div>
        <div className="anim-fade-up mt-9 flex flex-wrap gap-7 border-t border-line pt-6" style={{ animationDelay: '540ms' }}>
          <Stat value={members} label="members" />
          <Stat value={points} label="points earned" />
          <Stat value={katas} label="katas open" />
        </div>
      </div>

      <BeltLadder ranked={ranked} loading={loading} />
    </section>
  )
}

function Stat({ value, label }: { value?: number; label: string }) {
  const n = useCountUp(value ?? 0, 1200, value != null)
  return (
    <div>
      {value == null ? (
        <span className="skeleton block h-8 w-16 rounded-md" />
      ) : (
        <b className="display block text-[26px] font-extrabold sm:text-[30px]">{n.toLocaleString()}</b>
      )}
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  )
}

function BeltLadder({ ranked, loading }: { ranked: RankedMember[]; loading: boolean }) {
  const { ref, inView } = useInView<HTMLElement>()
  const rungs = [...BELTS].reverse()

  return (
    <aside
      ref={ref}
      className="anim-fade-up min-w-0 flex-[1_1_400px] rounded-[22px] bg-night px-4 pt-5 pb-3 text-paper sm:px-6 sm:pt-6"
      style={{ animationDelay: '250ms' }}
      aria-label="Belt ladder"
    >
      <div className="mb-3.5 flex items-baseline justify-between gap-3">
        <h2 className="display text-[22px] font-bold">The belt ladder</h2>
        <span className="text-[13px] text-night-muted">by points</span>
      </div>
      {rungs.map((b, i) => {
        const people = ranked.filter((m) => m.progress.belt.kyu === b.kyu)
        const empty = people.length === 0
        return (
          <div
            key={b.kyu}
            className={`group grid grid-cols-[52px_48px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-night-line py-2.5 sm:grid-cols-[74px_62px_minmax(0,1fr)_auto] sm:gap-3.5 ${
              inView ? 'anim-slide' : 'opacity-0'
            }`}
            style={{ animationDelay: `${300 + i * 60}ms` }}
          >
            <BeltStrip belt={b} ring="#15161A" />
            <span className={`text-sm font-bold ${empty ? 'text-[#6B707A]' : ''}`}>{b.kyu} kyu</span>
            <span className={`text-xs ${empty ? 'text-[#6B707A]' : 'text-night-muted'}`}>{beltRange(b)}</span>
            <span className="flex items-center justify-end">
              {loading ? (
                <span className="h-7 w-12 animate-pulse rounded-full bg-night-line" />
              ) : (
                <>
                  {people.slice(0, 3).map((m, j) => (
                    <span
                      key={m.username}
                      className={`-ml-2 first:ml-0 ${inView ? 'anim-pop' : 'opacity-0'}`}
                      style={{ animationDelay: `${600 + i * 60 + j * 70}ms` }}
                      title={m.username}
                    >
                      <Avatar name={m.username} size="xs" ring="#15161A" />
                    </span>
                  ))}
                  <span className="ml-2 min-w-4 text-xs text-night-muted">
                    {people.length > 3 ? `+${people.length - 3}` : empty ? '—' : ''}
                  </span>
                </>
              )}
            </span>
          </div>
        )
      })}
    </aside>
  )
}

/* ---------------------------------- Board --------------------------------- */

type Filter = 'all' | BeltColor
const filters: Filter[] = ['all', 'purple', 'blue', 'yellow', 'white']

function Board({
  ranked,
  raw,
  loading,
  error,
  retry,
  updatedAt,
}: {
  ranked: RankedMember[]
  raw?: Member[]
  loading: boolean
  error?: string
  retry: () => Promise<void>
  updatedAt?: Date
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const now = useNow()
  const gains = useGains(raw)

  const q = query.trim().toLowerCase()
  const visible = ranked.filter(
    (m) => (filter === 'all' || m.progress.belt.color === filter) && (!q || m.username.toLowerCase().includes(q)),
  )
  const showPodium = filter === 'all' && !q
  const podium = showPodium ? ranked.slice(0, 3) : []
  const rest = showPodium ? ranked.slice(3) : visible
  const counts = (f: Filter) => (f === 'all' ? ranked.length : ranked.filter((m) => m.progress.belt.color === f).length)

  return (
    <section className="pt-16 sm:pt-20" aria-label="Leaderboard" id="board">
      <Reveal>
        <SectionHeader
          title="The board"
          subtitle={
            <span className="inline-flex items-center gap-2">
              <span className="live-dot inline-block size-2 rounded-full bg-[#2DA463]" />
              Top 20 members · updated {timeAgo(updatedAt, now)}
            </span>
          }
          right={
            <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
              <div className="flex w-full rounded-full bg-chip p-1 sm:w-auto" role="group" aria-label="Filter by belt">
                {filters.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    aria-pressed={filter === f}
                    className={`min-h-9 flex-1 rounded-full px-3 text-[13px] font-semibold transition-all duration-200 sm:flex-none sm:text-sm ${
                      filter === f ? 'bg-white text-ink shadow-[0_1px_2px_rgba(0,0,0,.08)]' : 'text-[#4A4E57] hover:text-ink'
                    }`}
                  >
                    {f === 'all' ? 'All' : beltStyle[f].label}
                    <span className="ml-1 hidden text-xs font-medium text-muted sm:inline">{counts(f)}</span>
                  </button>
                ))}
              </div>
              <input
                className="input h-11 rounded-full sm:w-52"
                placeholder="Find a member"
                aria-label="Find a member"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          }
        />
      </Reveal>

      {error && (
        <Notice kind="error">
          {error}{' '}
          <button className="font-semibold underline" onClick={() => void retry()}>
            Try again
          </button>
        </Notice>
      )}

      {loading && <BoardSkeleton />}

      {!loading && !error && ranked.length === 0 && (
        <EmptyState title="No one on the board yet">Once execs add members, they'll appear here as they solve katas.</EmptyState>
      )}

      {podium.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {podium.map((m, i) => (
            <Reveal key={m.username} delay={i * 110}>
              <PodiumCard member={m} leader={ranked[0]} second={ranked[1]} gain={gains[m.username]} />
            </Reveal>
          ))}
        </div>
      )}

      {!loading && ranked.length > 0 && rest.length === 0 && !showPodium && (
        <p className="card anim-fade-up py-10 text-center text-muted">No members match those filters.</p>
      )}

      {rest.length > 0 && (
        <div className="card mt-4 overflow-hidden">
          {rest.map((m, i) => (
            <Row key={m.username} member={m} index={i} gain={gains[m.username]} />
          ))}
        </div>
      )}
    </section>
  )
}

function PodiumCard({
  member: m,
  leader,
  second,
  gain,
}: {
  member: RankedMember
  leader: RankedMember
  second?: RankedMember
  gain?: { n: number; key: number }
}) {
  const pts = useCountUp(m.points, 1300)
  const s = beltStyle[m.progress.belt.color]
  const isTop = m.rank === 1
  const note = isTop
    ? second && second.points === m.points
      ? 'Tied at the top'
      : second
        ? `${m.points - second.points} pts clear at the top`
        : 'Leading the board'
    : m.points === leader.points
      ? 'Tied for 1st'
      : `${leader.points - m.points} pts behind 1st`

  return (
    <article key={gain?.key} className={`card lift group relative flex h-full flex-col overflow-hidden ${gain ? 'anim-flash' : ''}`}>
      <div className="h-2.5" style={{ background: s.fill }} />
      <div className="flex flex-1 flex-col gap-3.5 p-5 sm:p-[22px]">
        <div className="flex items-center justify-between">
          <span className={`display text-[44px] leading-none font-extrabold ${isTop ? 'text-club' : ''}`}>{ordinal(m.rank)}</span>
          <BeltChip belt={m.progress.belt} suffix=" belt" />
        </div>
        <a href={profileUrl(m.username)} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-3">
          <Avatar name={m.username} size="md" className="transition-transform duration-300 group-hover:scale-105" />
          <span className="min-w-0">
            <b className="block truncate text-[19px] font-bold group-hover:underline">{m.username}</b>
            <span className="text-[13px] text-muted">{note}</span>
          </span>
        </a>
        <div className="relative flex items-baseline gap-1.5">
          <span className="display text-[30px] font-extrabold">{pts.toLocaleString()}</span>
          <span className="text-[13px] font-medium text-muted">points</span>
          {gain && <GainBadge key={gain.key} n={gain.n} />}
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <Progress pct={m.progress.pct} color={s.bar} />
          <span className="text-[12.5px] text-muted">
            {m.progress.next ? `${m.progress.toNext} pts to ${m.progress.next.kyu} kyu` : 'Top belt reached'}
          </span>
        </div>
      </div>
    </article>
  )
}

function Row({ member: m, index, gain }: { member: RankedMember; index: number; gain?: { n: number; key: number } }) {
  const { ref, inView } = useInView<HTMLDivElement>()
  const s = beltStyle[m.progress.belt.color]
  return (
    <div
      ref={ref}
      key={gain?.key}
      className={`grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 border-t border-line-soft px-3.5 py-3 transition-colors first:border-t-0 hover:bg-[#FAFBFC] sm:grid-cols-[44px_minmax(0,1.4fr)_96px_minmax(0,1fr)_80px] sm:gap-4 sm:px-[22px] ${
        inView ? 'anim-fade-up' : 'opacity-0'
      } ${gain ? 'anim-flash' : ''}`}
      style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
    >
      <span className="font-bold text-muted">{m.rank}</span>
      <a href={profileUrl(m.username)} target="_blank" rel="noreferrer" className="group flex min-w-0 items-center gap-3 font-semibold">
        <Avatar name={m.username} size="sm" className="transition-transform duration-300 group-hover:scale-110" />
        <span className="truncate group-hover:underline">{m.username}</span>
      </a>
      <span className="hidden sm:block">
        <BeltChip belt={m.progress.belt} />
      </span>
      <span className="hidden items-center gap-2.5 sm:flex">
        <span className="flex-1">{inView && <Progress pct={m.progress.pct} color={s.bar} height={6} />}</span>
        <span className="text-xs whitespace-nowrap text-muted">
          {m.progress.next ? `${m.progress.toNext} to ${m.progress.next.kyu} kyu` : 'top belt'}
        </span>
      </span>
      <span className="relative text-right text-base font-bold">
        {m.points.toLocaleString()}
        {gain && <GainBadge key={gain.key} n={gain.n} right />}
      </span>
    </div>
  )
}

function GainBadge({ n, right }: { n: number; right?: boolean }) {
  return (
    <span
      className={`anim-float pointer-events-none absolute -top-5 rounded-full bg-[#2DA463] px-2 py-0.5 text-xs font-bold text-white ${
        right ? 'right-0' : 'left-24'
      }`}
    >
      +{n}
    </span>
  )
}

function BoardSkeleton() {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card flex flex-col gap-4 p-5">
            <span className="skeleton h-10 w-16 rounded-md" />
            <span className="flex items-center gap-3">
              <span className="skeleton size-12 rounded-full" />
              <span className="skeleton h-5 w-28 rounded-md" />
            </span>
            <span className="skeleton h-8 w-20 rounded-md" />
            <span className="skeleton h-2 rounded-full" />
          </div>
        ))}
      </div>
      <div className="card mt-4 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 border-t border-line-soft px-5 py-3.5 first:border-t-0">
            <span className="skeleton size-[34px] rounded-full" />
            <span className="skeleton h-4 w-32 rounded-md" />
            <span className="skeleton ml-auto h-4 w-10 rounded-md" />
          </div>
        ))}
      </div>
    </>
  )
}

/* ------------------------------ How it works ------------------------------ */

function HowItWorks() {
  const steps = [
    { n: 1, title: 'Get added', body: "Send your Codewars username to a club exec. They'll put you on the board." },
    { n: 2, title: 'Solve katas', body: "Pick any kata from this season's list and solve it on Codewars, in any language." },
    { n: 3, title: 'Rank up', body: 'Points land within minutes. Earn enough and you move up a belt on the ladder.' },
  ]
  return (
    <>
      <section className="scroll-mt-24 pt-16 sm:pt-20" id="how" aria-label="How it works">
        <Reveal>
          <SectionHeader title="How it works" subtitle="Three steps from sign-up to the top of the board." />
        </Reveal>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110} className="h-full">
              <div className="card lift group h-full p-[22px]">
                <span className="display flex size-10 items-center justify-center rounded-xl bg-ink text-lg font-extrabold text-white transition-colors duration-300 group-hover:bg-club">
                  {s.n}
                </span>
                <h3 className="mt-4 mb-1.5 text-lg font-bold">{s.title}</h3>
                <p className="leading-relaxed text-[#4A4E57]">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal as="section" className="mt-16 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-night p-7 text-paper sm:p-10">
        <div>
          <h2 className="display text-[26px] font-extrabold sm:text-[34px]">Ready to train?</h2>
          <p className="mt-2 text-[#B7BBC4]">Every APC member can join. Pick a kata and start climbing.</p>
        </div>
        <Link to="/katas" className="btn-club max-sm:w-full">
          Browse katas
        </Link>
      </Reveal>
    </>
  )
}

/* --------------------------------- helpers -------------------------------- */

const ordinal = (n: number) => {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th'
  return `${n}${s}`
}

function useNow(intervalMs = 5000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}
