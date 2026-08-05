import { Suspense, lazy } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'motion/react'
import ViewPage from '@/pages/ViewPage'
import PageTransition from '@/components/PageTransition'

// / est la page publique — c'est elle que la quasi-totalité des visiteurs
// charge. /edit embarque react-hook-form, le résolveur zod et les sections
// d'édition : sans ce découpage, ce code (et son poids) arrive même chez
// quelqu'un qui ne fait que consulter un profil. Les pages /debug ne font
// partie d'aucun parcours public, même traitement.
const EditPage = lazy(() => import('@/pages/EditPage'))
const DebugCodecPage = lazy(() => import('@/pages/DebugCodecPage'))
const DebugThemePage = lazy(() => import('@/pages/DebugThemePage'))

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
                <EditPage />
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
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AnimatedRoutes />
    </HashRouter>
  )
}
