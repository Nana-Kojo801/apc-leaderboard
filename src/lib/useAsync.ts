import { useCallback, useEffect, useRef, useState } from 'react'

interface AsyncState<T> {
  data: T | undefined
  error: Error | undefined
  loading: boolean
  /** Timestamp of the last successful load. */
  updatedAt: Date | undefined
  reload: () => Promise<void>
}

/** Loads data on mount and (optionally) re-polls it every `intervalMs`. */
export function useAsync<T>(fn: () => Promise<T>, intervalMs?: number): AsyncState<T> {
  const [data, setData] = useState<T>()
  const [error, setError] = useState<Error>()
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState<Date>()
  const fnRef = useRef(fn)
  fnRef.current = fn

  const reload = useCallback(async () => {
    try {
      const result = await fnRef.current()
      setData(result)
      setError(undefined)
      setUpdatedAt(new Date())
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
    if (!intervalMs) return
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reload()
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [reload, intervalMs])

  return { data, error, loading, updatedAt, reload }
}
