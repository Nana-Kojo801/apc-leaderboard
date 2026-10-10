import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Leaderboard from './pages/Leaderboard'
import Katas from './pages/Katas'
import Admin from './pages/Admin'
import { EmptyState } from './components/ui'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Leaderboard />} />
        <Route path="katas" element={<Katas />} />
        <Route path="challenges" element={<Katas />} />
        <Route path="admin" element={<Admin />} />
        <Route
          path="*"
          element={
            <div className="mx-auto max-w-[1180px] px-4 pt-12 sm:px-8">
              <EmptyState title="That page wandered off">
                <Link to="/" className="font-semibold text-club underline">
                  Back to the board
                </Link>
              </EmptyState>
            </div>
          }
        />
      </Route>
    </Routes>
  )
}
