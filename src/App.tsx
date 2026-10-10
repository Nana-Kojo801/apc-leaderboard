import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Leaderboard from './pages/Leaderboard'
import Challenges from './pages/Challenges'
import Admin from './pages/Admin'
import { EmptyState } from './components/ui'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Leaderboard />} />
        <Route path="challenges" element={<Challenges />} />
        <Route path="admin" element={<Admin />} />
        <Route path="*" element={<EmptyState title="Page not found">That page doesn't exist.</EmptyState>} />
      </Route>
    </Routes>
  )
}
