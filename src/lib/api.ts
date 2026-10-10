// Thin client for the APC leaderboard server (ASP.NET Core).
// All requests are same-origin so the HttpOnly `APCAuth` cookie is sent automatically.

export interface Member {
  username: string
  points: number
}

export interface Kata {
  kataRemoteId: string
  kataName: string
  kataUrl: string
  pointDifficulty: number
}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const BASE = '/api'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      credentials: 'same-origin',
      ...init,
      headers: {
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    })
  } catch {
    throw new ApiError(0, 'Could not reach the leaderboard server.')
  }

  const text = await res.text()

  if (!res.ok) {
    throw new ApiError(res.status, errorMessage(res.status, text))
  }

  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    // The server answers most mutations with a plain-text message.
    return text as T
  }
}

function errorMessage(status: number, body: string): string {
  // Controllers return plain strings for expected errors; validation errors are ProblemDetails JSON.
  if (body && !body.trimStart().startsWith('{') && !body.trimStart().startsWith('<')) {
    return body.replace(/^"|"$/g, '')
  }
  try {
    const problem = JSON.parse(body) as { title?: string }
    if (problem.title) return problem.title
  } catch {
    /* fall through */
  }
  if (status === 401) return 'You need to sign in to do that.'
  if (status === 403) return 'Your account does not have admin access.'
  if (status === 404) return 'Not found.'
  if (status >= 500) return 'The server ran into a problem. Try again shortly.'
  return `Request failed (${status}).`
}

const json = (body: unknown) => JSON.stringify(body)

export const api = {
  leaderboard: () => request<Member[]>('/Main/leaderboard'),
  katas: () => request<Kata[]>('/Main/katas'),

  login: (userEmail: string, password: string) =>
    request<string>('/Auth/login', { method: 'POST', body: json({ userEmail, password }) }),
  register: (userEmail: string, password: string) =>
    request<string>('/Auth/register', { method: 'POST', body: json({ userEmail, password }) }),
  logout: () => request<string>('/Auth/logout', { method: 'POST' }),

  addMember: (username: string) =>
    request<string>('/Admin/members', { method: 'POST', body: json({ username, points: 0 }) }),
  deleteMember: (username: string) =>
    request<string>(`/Admin/members/${encodeURIComponent(username)}`, { method: 'DELETE' }),
  addKata: (kata: Kata) => request<string>('/Admin/katas', { method: 'POST', body: json(kata) }),
  deleteKata: (kataRemoteId: string) =>
    request<string>(`/Admin/katas/${encodeURIComponent(kataRemoteId)}`, { method: 'DELETE' }),
}
