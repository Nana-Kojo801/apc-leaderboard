import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../auth'

const links = [
  { to: '/', label: 'Leaderboard', end: true },
  { to: '/challenges', label: 'Challenges', end: false },
  { to: '/admin', label: 'Admin', end: false },
]

export default function Layout() {
  const { email } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-ink-700/70 bg-ink-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <NavLink to="/" className="flex shrink-0 items-center gap-2.5">
            <Logo />
            <span className="leading-tight">
              <span className="block text-sm font-bold tracking-tight">
                <span className="sm:hidden">APC</span>
                <span className="hidden sm:inline">APC Leaderboard</span>
              </span>
              <span className="hidden text-[11px] text-ink-400 sm:block">Ashesi Programming Club</span>
            </span>
          </NavLink>

          <nav className="flex items-center gap-0.5 text-sm sm:gap-1">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.end}
                className={({ isActive }) =>
                  `rounded-lg px-2.5 py-1.5 font-medium sm:px-3 transition ${
                    isActive ? 'bg-ink-800 text-ink-100' : 'text-ink-400 hover:text-ink-100'
                  }`
                }
              >
                {l.label}
                {l.to === '/admin' && email && (
                  <span className="ml-1.5 inline-block size-1.5 rounded-full bg-emerald-400 align-middle" />
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-ink-800 py-6 text-center text-xs text-ink-400">
        Points are awarded automatically when members solve tracked katas on{' '}
        <a href="https://www.codewars.com" target="_blank" rel="noreferrer" className="underline hover:text-ink-100">
          Codewars
        </a>
        .
      </footer>
    </div>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="size-9" aria-hidden>
      <rect width="32" height="32" rx="9" fill="#f5b83d" />
      <path d="M9 22V12l4 4 3-6 3 6 4-4v10z" fill="#07090f" />
    </svg>
  )
}
