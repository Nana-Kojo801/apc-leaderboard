import type { Kata } from '../lib/api'
import { useCodewarsKata } from '../lib/useCodewarsKata'
import { KyuBadge } from './ui'

export default function KataCard({ kata }: { kata: Kata }) {
  const info = useCodewarsKata(kata.kataRemoteId)

  return (
    <article className="card lift group flex h-full flex-col gap-3 p-5 hover:border-[#D3D6DD]">
      <div className="flex items-center justify-between gap-3">
        {info === null ? <span /> : <KyuBadge rank={info?.rank} />}
        <span className="display text-[28px] font-extrabold text-club transition-transform duration-300 group-hover:scale-110">
          +{kata.pointDifficulty}
        </span>
      </div>
      <h3 className="text-[19px] leading-snug font-bold">{kata.kataName || info?.name || kata.kataRemoteId}</h3>
      <p className="text-[13px] text-muted">
        {info?.category ? <span className="capitalize">{info.category}</span> : <span>&nbsp;</span>}
        {info?.totalCompleted != null && <> · {info.totalCompleted.toLocaleString()} solves on Codewars</>}
      </p>
      <a href={kata.kataUrl} target="_blank" rel="noreferrer" className="btn-soft mt-auto">
        Solve on Codewars
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </a>
    </article>
  )
}

export function KataCardSkeleton() {
  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex justify-between">
        <span className="skeleton h-6 w-20 rounded-md" />
        <span className="skeleton h-8 w-14 rounded-md" />
      </div>
      <span className="skeleton h-6 w-3/4 rounded-md" />
      <span className="skeleton h-4 w-1/2 rounded-md" />
      <span className="skeleton mt-3 h-11 rounded-xl" />
    </div>
  )
}
