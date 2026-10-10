import type { CSSProperties, ReactNode } from 'react'
import { beltStyle, type Belt } from '../lib/belts'
import type { CodewarsRank } from '../lib/codewars'
import { useMounted } from '../lib/motion'

const tints: [string, string][] = [
  ['#FCE4E2', '#8E1D17'],
  ['#E2ECFC', '#1E4FA8'],
  ['#DFF3E8', '#1F6B43'],
  ['#FDF1C8', '#6E5400'],
  ['#EEE6FA', '#5A33A0'],
]

/** Stable colour for a username so members keep the same avatar everywhere. */
function tintFor(name: string): [string, string] {
  let h = 0
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return tints[h % tints.length]
}

export function Avatar({
  name,
  size = 'md',
  ring,
  className = '',
}: {
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  ring?: string
  className?: string
}) {
  const [bg, fg] = tintFor(name)
  const dims = { xs: 'size-7 text-[10px]', sm: 'size-[34px] text-xs', md: 'size-12 text-base', lg: 'size-14 text-lg' }[size]
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold uppercase ${dims} ${className}`}
      style={{ background: bg, color: fg, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
      aria-hidden
    >
      {name.slice(0, 2)}
    </span>
  )
}

export function BeltChip({ belt, suffix = '' }: { belt: Belt; suffix?: string }) {
  const s = beltStyle[belt.color]
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold whitespace-nowrap"
      style={{ background: s.chipBg, color: s.chipFg }}
    >
      {belt.kyu} kyu{suffix}
    </span>
  )
}

export function BeltStrip({ belt, className = '', ring }: { belt: Belt; className?: string; ring?: string }) {
  return (
    <span
      className={`belt block ${className}`}
      style={{ background: beltStyle[belt.color].fill, ['--knot-ring' as string]: ring }}
      aria-hidden
    />
  )
}

/** Progress bar that grows from 0 on mount. */
export function Progress({ pct, color, height = 8 }: { pct: number; color: string; height?: number }) {
  const mounted = useMounted()
  return (
    <span className="block overflow-hidden rounded-full bg-[#ECEEF2]" style={{ height }}>
      <span
        className="bar-fill block h-full rounded-full"
        style={{ width: mounted ? `${Math.max(pct, pct > 0 ? 3 : 0)}%` : '0%', background: color }}
      />
    </span>
  )
}

const kyuSwatch: Record<string, CSSProperties> = {
  white: { background: '#E4E6EB', boxShadow: 'inset 0 0 0 1px #C9CCD3' },
  yellow: { background: '#F2C230' },
  blue: { background: '#2F6FDE' },
  purple: { background: '#7B4BC9' },
}

/** Codewars difficulty for a kata (yellow 6 kyu, etc). `undefined` = loading; a rank without a name = beta. */
export function KyuBadge({ rank }: { rank?: CodewarsRank }) {
  if (rank === undefined) return <span className="skeleton inline-block h-6 w-16 rounded-md" />
  if (!rank.name)
    return (
      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-muted">
        <i className="inline-block size-[22px] rounded-md border-[1.5px] border-dashed border-[#9AA0AA]" />
        beta
      </span>
    )
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-bold">
      <i className="inline-block size-[22px] rounded-md" style={kyuSwatch[rank.color] ?? kyuSwatch.white} />
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
    error: 'border-[#F3C4C0] bg-[#FDF0EF] text-[#8E1D17]',
    success: 'border-[#BFE3CF] bg-[#EEF8F2] text-[#1F6B43]',
    info: 'border-[#C9D9F6] bg-[#EFF4FD] text-[#1E4FA8]',
  }[kind]
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`anim-fade-up rounded-xl border px-3.5 py-2.5 text-sm ${styles}`}>
      {children}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card anim-fade-up flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-4 w-20">
        <span className="belt block" style={{ background: '#E4E6EB', ['--knot-ring' as string]: '#fff' }} />
      </span>
      <h3 className="display text-xl font-bold">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-muted">{children}</div>}
    </div>
  )
}

export function SectionHeader({ title, subtitle, right }: { title: ReactNode; subtitle?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="display text-[30px] leading-tight font-extrabold sm:text-[38px]">{title}</h2>
        {subtitle && <p className="mt-1.5 text-muted">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}
