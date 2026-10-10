export function timeAgo(date: Date | undefined, now: number): string {
  if (!date) return '—'
  const s = Math.max(0, Math.round((now - date.getTime()) / 1000))
  if (s < 5) return 'just now'
  if (s < 60) return `${s}s ago`
  return `${Math.floor(s / 60)}m ago`
}
