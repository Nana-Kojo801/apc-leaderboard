import type { ReactNode } from 'react'
import type { CodewarsRank } from '../lib/codewars'

const avatarHues = [12, 38, 160, 190, 220, 260, 290, 330]

export function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const hue = avatarHues[h % avatarHues.length]
  const dims = { sm: 'size-8 text-xs', md: 'size-10 text-sm', lg: 'size-16 text-xl' }[size]

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase ${dims}`}
      style={{ background: `hsl(${hue} 55% 22%)`, color: `hsl(${hue} 85% 78%)` }}
      aria-hidden
    >
      {name.slice(0, 2)}
    </span>
  )
}

const kyuStyles: Record<string, string> = {
  white: 'border-ink-300/40 text-ink-100',
  yellow: 'border-yellow-400/50 text-yellow-300',
  blue: 'border-sky-400/50 text-sky-300',
  purple: 'border-violet-400/50 text-violet-300',
}

export function KyuBadge({ rank }: { rank?: CodewarsRank | null }) {
  if (!rank) return <span className="inline-block h-5 w-12 animate-pulse rounded bg-ink-700/60" />
  // Beta katas haven't been ranked yet.
  if (!rank.name)
    return (
      <span className="inline-flex items-center rounded-md border border-dashed border-ink-600 px-1.5 py-0.5 font-mono text-[11px] text-ink-400">
        beta
      </span>
    )
  return (
    <span
      className={`inline-flex items-center rounded-md border px-1.5 py-0.5 font-mono text-[11px] font-semibold ${
        kyuStyles[rank.color] ?? kyuStyles.white
      }`}
    >
      {rank.name}
    </span>
  )
}

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-block size-4 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`}
      aria-label="Loading"
    />
  )
}

export function Notice({ kind, children }: { kind: 'error' | 'success' | 'info'; children: ReactNode }) {
  const styles = {
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    info: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  }[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-3 text-3xl" aria-hidden>
        🏁
      </div>
      <h3 className="font-semibold">{title}</h3>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-400">{children}</div>}
    </div>
  )
}

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
