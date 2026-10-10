import { api, type Kata } from '../lib/api'
import { useCodewarsKata } from '../lib/useCodewarsKata'
import { useAsync } from '../lib/useAsync'
import { EmptyState, KyuBadge, Notice, PageHeader, Spinner } from '../components/ui'

export default function Challenges() {
  const { data, error, loading, reload } = useAsync(api.katas, 60_000)
  const total = (data ?? []).reduce((s, k) => s + k.pointDifficulty, 0)

  return (
    <>
      <PageHeader
        title="Challenges"
        subtitle={
          data && data.length > 0
            ? `${data.length} tracked kata${data.length === 1 ? '' : 's'} · ${total.toLocaleString()} points up for grabs`
            : 'Katas tracked by the club. Solve them on Codewars to earn points.'
        }
      />

      <div className="mb-6">
        <Notice kind="info">
          Solve any of these on Codewars with your registered username. Points are added to the leaderboard
          automatically within a few minutes — each kata counts once.
        </Notice>
      </div>

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

      {data && data.length === 0 && (
        <EmptyState title="No challenges yet">An admin hasn't added any katas to track yet. Check back soon!</EmptyState>
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {data.map((k) => (
            <KataCard key={k.kataRemoteId} kata={k} />
          ))}
        </ul>
      )}
    </>
  )
}

function KataCard({ kata }: { kata: Kata }) {
  const info = useCodewarsKata(kata.kataRemoteId)

  return (
    <li className="card group flex flex-col p-5 transition hover:border-ink-600">
      <div className="mb-3 flex items-center justify-between gap-3">
        {info === null ? <span /> : <KyuBadge rank={info?.rank} />}
        <span className="rounded-full bg-gold/10 px-2.5 py-1 font-mono text-xs font-bold text-gold">
          +{kata.pointDifficulty} pts
        </span>
      </div>
      <h3 className="font-semibold leading-snug">{kata.kataName || info?.name || kata.kataRemoteId}</h3>
      {info?.category && <p className="mt-1 text-xs capitalize text-ink-400">{info.category}</p>}
      <div className="mt-auto flex items-center justify-between pt-5">
        <span className="text-xs text-ink-400">
          {info?.totalCompleted != null && `${info.totalCompleted.toLocaleString()} solves worldwide`}
        </span>
        <a href={kata.kataUrl} target="_blank" rel="noreferrer" className="btn-ghost px-3 py-1.5 text-xs">
          Solve on Codewars ↗
        </a>
      </div>
    </li>
  )
}
