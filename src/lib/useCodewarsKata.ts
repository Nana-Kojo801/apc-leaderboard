import { useEffect, useState } from 'react'
import { fetchKata, type CodewarsKata } from './codewars'

/** Codewars metadata for a kata: `undefined` while loading, `null` if unavailable. */
export function useCodewarsKata(id: string) {
  const [info, setInfo] = useState<CodewarsKata | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    void fetchKata(id).then((r) => alive && setInfo(r))
    return () => {
      alive = false
    }
  }, [id])
  return info
}
