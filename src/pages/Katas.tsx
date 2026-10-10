import { api } from '../lib/api'
import { useAsync } from '../lib/useAsync'
import KataCard, { KataCardSkeleton } from '../components/KataCard'
import Reveal from '../components/Reveal'
import { EmptyState, Notice } from '../components/ui'

export default function Katas() {
  const { data, error, loading, reload } = useAsync(api.katas, 60_000)
  const total = (data ?? []).reduce((s, k) => s + k.pointDifficulty, 0)

  return (
    <div className="mx-auto max-w-[1180px] px-4 sm:px-8">
      <section className="pt-6 pb-10 sm:pt-12">
        <p className="anim-fade-up text-sm font-semibold text-club">The training list</p>
        <h1 className="display anim-fade-up mt-2 text-[clamp(38px,5vw,60px)] leading-[1.02] font-extrabold" style={{ animationDelay: '80ms' }}>
          Katas this season
        </h1>
        <p className="anim-fade-up mt-4 max-w-[560px] text-[17px] leading-relaxed text-[#4A4E57]" style={{ animationDelay: '160ms' }}>
          Solve any of these on Codewars with your registered username. Points reach the board within a few minutes, and
          each kata counts once.
        </p>
        {data && data.length > 0 && (
          <div className="anim-fade-up mt-6 flex flex-wrap gap-2.5" style={{ animationDelay: '240ms' }}>
            <span className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold">
              {data.length} kata{data.length === 1 ? '' : 's'}
            </span>
            <span className="rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-semibold">
              {total.toLocaleString()} points up for grabs
            </span>
          </div>
        )}
      </section>

      {error && !data && (
        <Notice kind="error">
          {error.message}{' '}
          <button className="font-semibold underline" onClick={() => void reload()}>
            Try again
          </button>
        </Notice>
      )}

      {loading && !data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <KataCardSkeleton key={i} />
          ))}
        </div>
      )}

      {data && data.length === 0 && (
        <EmptyState title="No katas yet">An exec hasn't added this season's katas. Check back soon.</EmptyState>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((k, i) => (
            <Reveal key={k.kataRemoteId} delay={(i % 3) * 90} className="h-full">
              <KataCard kata={k} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  )
}
