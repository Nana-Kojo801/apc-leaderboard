// Direct calls to the public Codewars API (it sends `Access-Control-Allow-Origin: *`).
// Used only to enrich the UI — the leaderboard server stays the source of truth.

const CW = 'https://www.codewars.com/api/v1'

export interface CodewarsRank {
  id: number | null // -8 (8 kyu) … -1 (1 kyu); null for beta katas
  name: string | null // "6 kyu"
  color: 'white' | 'yellow' | 'blue' | 'purple' | string
}

export interface CodewarsKata {
  id: string
  name: string
  slug: string
  url: string
  category: string
  rank: CodewarsRank
  totalCompleted?: number
}

export interface CodewarsUser {
  username: string
  name: string | null
  honor: number
  clan: string | null
  ranks: { overall: CodewarsRank }
}

const kataCache = new Map<string, Promise<CodewarsKata | null>>()

export function fetchKata(id: string): Promise<CodewarsKata | null> {
  let p = kataCache.get(id)
  if (!p) {
    p = fetch(`${CW}/code-challenges/${encodeURIComponent(id)}`)
      .then((r) => (r.ok ? (r.json() as Promise<CodewarsKata>) : null))
      .catch(() => null)
    kataCache.set(id, p)
  }
  return p
}

export async function fetchUser(username: string): Promise<CodewarsUser | null> {
  try {
    const r = await fetch(`${CW}/users/${encodeURIComponent(username)}`)
    return r.ok ? ((await r.json()) as CodewarsUser) : null
  } catch {
    return null
  }
}

/** Accepts a raw kata id, slug, or any codewars.com/kata/... URL and returns the id/slug part. */
export function parseKataRef(input: string): string {
  const trimmed = input.trim()
  const m = trimmed.match(/codewars\.com\/kata\/([^/?#\s]+)/i)
  return m ? m[1] : trimmed
}

export const profileUrl = (username: string) =>
  `https://www.codewars.com/users/${encodeURIComponent(username)}`

export const kataUrl = (id: string) => `https://www.codewars.com/kata/${id}`

/** A starting point for kata points by difficulty; admins can always override. */
export function suggestedPoints(rank: CodewarsRank | undefined): number {
  const kyu = rank?.id ? Math.abs(rank.id) : 0
  const table: Record<number, number> = { 8: 10, 7: 20, 6: 35, 5: 50, 4: 80, 3: 120, 2: 180, 1: 250 }
  return table[kyu] ?? 25
}
