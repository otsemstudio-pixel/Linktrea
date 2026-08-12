import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import ViewPage from '@/pages/ViewPage'
import PageTransition from '@/components/PageTransition'
import RequireAuth from '@/components/RequireAuth'
import { AuthProvider } from '@/lib/auth/AuthContext'

// / est la page publique — c'est elle que la quasi-totalité des visiteurs
// charge. /edit embarque react-hook-form, le résolveur zod et les sections
// d'édition : sans ce découpage, ce code (et son poids) arrive même chez
// quelqu'un qui ne fait que consulter un profil. Les pages /debug ne font
// partie d'aucun parcours public, même traitement.
const EditPage = lazy(() => import('@/pages/EditPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage'))
const DebugCodecPage = lazy(() => import('@/pages/DebugCodecPage'))
const DebugThemePage = lazy(() => import('@/pages/DebugThemePage'))
const DebugStorePage = lazy(() => import('@/pages/DebugStorePage'))
const DebugCvPage = lazy(() => import('@/pages/DebugCvPage'))
const SlugPage = lazy(() => import('@/pages/SlugPage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><ViewPage /></PageTransition>} />
        <Route path="/p/:payload" element={<PageTransition><ViewPage /></PageTransition>} />
        <Route
          path="/edit"
          element={
            <PageTransition>
              <Suspense fallback={null}>
                <RequireAuth>
                  <EditPage />
                </RequireAuth>
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/login"
          element={
            <PageTransition>
              <Suspense fallback={null}>
                <LoginPage />
              </Suspense>
            </PageTransition>
          }
        />
        <Route
          path="/debug/codec"
          element={
            <Suspense fallback={null}>
              <DebugCodecPage />
            </Suspense>
          }
        />
        <Route
          path="/debug/theme"
          element={
            <Suspense fallback={null}>
              <DebugThemePage />
            </Suspense>
          }
        />
        <Route
          path="/debug/store"
          element={
            <Suspense fallback={null}>
              <DebugStorePage />
            </Suspense>
          }
        />
        <Route
          path="/debug/cv"
          element={
            <Suspense fallback={null}>
              <DebugCvPage />
            </Suspense>
          }
        />
        <Route
          path="/admin"
          element={
            <Suspense fallback={null}>
              <AdminPage />
            </Suspense>
          }
        />
        {/* Doit rester la DERNIÈRE route : dynamique sur un seul segment,
            elle matcherait n'importe quel chemin fixe déclaré après elle. */}
        <Route
          path="/:slug"
          element={
            <PageTransition>
              <Suspense fallback={null}>
                <SlugPage />
              </Suspense>
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AnimatedRoutes />
      </HashRouter>
    </AuthProvider>
  )
}
