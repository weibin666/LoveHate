import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAppStore } from './store'
import Login from './pages/Login'
import Couple from './pages/Couple'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Letters from './pages/Letters'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import BottomNav from './components/BottomNav'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAppStore()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl animate-pulse">💕</div>
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  if (!user.couple_id) return <Couple />
  return <>{children}</>
}

function LoginRoute() {
  const { user, loading } = useAppStore()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Login />
}

export default function App() {
  const { init, user, couple } = useAppStore()

  useEffect(() => {
    init()
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg">
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {couple && user ? <Home couple={couple} user={user} /> : <div />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                {couple ? <Shop coupleId={couple.id} /> : <div />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/letters"
            element={
              <ProtectedRoute>
                {couple ? <Letters coupleId={couple.id} /> : <div />}
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        {user?.couple_id && <BottomNav />}
      </div>
    </BrowserRouter>
  )
}
