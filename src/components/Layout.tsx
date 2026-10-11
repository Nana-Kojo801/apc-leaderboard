import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

const links = [
  { to: '/', label: 'Leaderboard', end: true },
  { to: '/katas', label: 'Katas', end: false },
  { to: '/#how', label: 'How it works', end: false },
  { to: '/admin', label: 'Admin', end: false },
]

export default function Layout() {
  const { email } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Close the mobile menu on navigation, and honour #hash links across routes.
  useEffect(() => {
    setOpen(false)
    if (location.hash) {
      const id = location.hash.slice(1)
      const t = window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 60)
      return () => window.clearTimeout(t)
    }
    window.scrollTo({ top: 0 })
  }, [location.pathname, location.hash])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const isActive = (to: string, end: boolean) => {
    if (to.includes('#')) return false
    return end ? location.pathname === to : location.pathname.startsWith(to)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={`sticky top-0 z-30 transition-[background-color,box-shadow] duration-300 ${
          scrolled || open ? 'bg-paper shadow-[0_1px_0_#E1E3E8]' : 'bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4 sm:h-[72px] sm:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <Mark />
            <span className="leading-tight font-bold">
              Ashesi Programming Club
              <small className="block text-xs font-medium text-muted">Codewars dojo</small>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={`relative inline-flex min-h-10 items-center rounded-full px-3.5 font-medium transition-colors duration-200 ${
                  isActive(l.to, l.end) ? 'bg-ink text-white' : 'text-ink-2 hover:bg-chip'
                }`}
              >
                {l.label}
                {l.to === '/admin' && email && (
                  <span className="ml-2 inline-block size-1.5 rounded-full bg-[#2DA463]" aria-label="signed in" />
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/#how" className="btn-club hidden sm:inline-flex">
              Join the club
            </Link>
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-xl text-ink transition hover:bg-chip md:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                <path d={open ? 'M6 6l12 12M18 6 6 18' : 'M4 7h16M4 12h16M4 17h16'} className="transition-all" />
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <nav className="anim-fade-up border-t border-line px-4 pt-2 pb-4 md:hidden" aria-label="Mobile">
            {links.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={`anim-slide flex min-h-12 items-center rounded-xl px-3 text-[17px] font-semibold ${
                  isActive(l.to, l.end) ? 'bg-ink text-white' : 'text-ink hover:bg-chip'
                }`}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                {l.label}
              </NavLink>
            ))}
            <Link to="/#how" className="btn-club mt-3 w-full">
              Join the club
            </Link>
          </nav>
        )}
      </header>

      <main key={location.pathname} className="anim-fade-up flex-1">
        <Outlet />
      </main>

      <footer className="mx-auto mt-16 flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-7 text-[13px] text-muted sm:px-8">
        <span>Ashesi Programming Club</span>
        <span>
          Solves synced from{' '}
          <a href="https://www.codewars.com" target="_blank" rel="noreferrer" className="font-medium text-ink underline-offset-2 hover:underline">
            Codewars
          </a>
        </span>
      </footer>
    </div>
  )
}

function Mark() {
  return (
    <img
      src="/favicon.svg"
      alt=""
      width={40}
      height={40}
      className="size-10 transition-transform duration-500 ease-out group-hover:-rotate-12 group-hover:scale-105"
    />
  )
}
