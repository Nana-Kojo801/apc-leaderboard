// The club's belt ladder. Belts are worked out on the frontend from points alone,
// so execs can retune the thresholds here without touching the server.

export type BeltColor = 'white' | 'yellow' | 'blue' | 'purple'

export interface Belt {
  kyu: number // 8 (first belt) … 1 (top belt)
  min: number // points needed to reach it
  color: BeltColor
}

export const BELTS: Belt[] = [
  { kyu: 8, min: 0, color: 'white' },
  { kyu: 7, min: 50, color: 'white' },
  { kyu: 6, min: 100, color: 'yellow' },
  { kyu: 5, min: 150, color: 'yellow' },
  { kyu: 4, min: 250, color: 'blue' },
  { kyu: 3, min: 350, color: 'blue' },
  { kyu: 2, min: 450, color: 'purple' },
  { kyu: 1, min: 600, color: 'purple' },
]

export interface BeltProgress {
  belt: Belt
  next: Belt | null
  /** 0–100 progress from this belt to the next. */
  pct: number
  toNext: number
}

export function beltFor(points: number): BeltProgress {
  let belt = BELTS[0]
  for (const b of BELTS) if (points >= b.min) belt = b
  const next = BELTS.find((b) => b.kyu === belt.kyu - 1) ?? null
  const pct = next ? Math.min(100, Math.max(0, ((points - belt.min) / (next.min - belt.min)) * 100)) : 100
  return { belt, next, pct, toNext: next ? next.min - points : 0 }
}

export function beltRange(b: Belt): string {
  const next = BELTS.find((x) => x.kyu === b.kyu - 1)
  return next ? `${b.min}–${next.min - 1}` : `${b.min}+ pts`
}

/** Visual tokens per belt colour (fill, soft chip background, chip text). */
export const beltStyle: Record<BeltColor, { fill: string; bar: string; chipBg: string; chipFg: string; label: string }> = {
  white: { fill: '#E4E6EB', bar: '#9AA0AA', chipBg: '#EEF0F3', chipFg: '#3A3D44', label: 'White' },
  yellow: { fill: '#F2C230', bar: '#E0AE14', chipBg: '#FDF1C8', chipFg: '#6E5400', label: 'Yellow' },
  blue: { fill: '#2F6FDE', bar: '#2F6FDE', chipBg: '#E2ECFC', chipFg: '#1E4FA8', label: 'Blue' },
  purple: { fill: '#7B4BC9', bar: '#7B4BC9', chipBg: '#EEE6FA', chipFg: '#5A33A0', label: 'Purple' },
}
