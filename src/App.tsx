import { lazy, Suspense, useEffect } from 'react'
import { Footer, Nav, ReviewerBar, Toasts } from './components/chrome'
import { captureAttribution } from './data/store'
import { useRoute } from './lib/router'
import Landing from './pages/Landing'

const Join = lazy(() => import('./pages/Join'))
const Pass = lazy(() => import('./pages/Pass'))
const Wars = lazy(() => import('./pages/Wars'))
const Leaders = lazy(() => import('./pages/Leaders'))
const WhatsApp = lazy(() => import('./pages/WhatsApp'))
const HQ = lazy(() => import('./pages/HQ'))
const Plan = lazy(() => import('./pages/Plan'))
const Notes = lazy(() => import('./pages/Notes'))

const ROUTES: Record<string, React.ComponentType> = {
  '/': Landing,
  '/join': Join,
  '/pass': Pass,
  '/wars': Wars,
  '/leaders': Leaders,
  '/whatsapp': WhatsApp,
  '/hq': HQ,
  '/plan': Plan,
  '/notes': Notes,
}

const TITLES: Record<string, string> = {
  '/': 'AI Quest 60 · Build Your First AI Project in 60 Minutes',
  '/join': 'Join · AI Quest 60',
  '/pass': 'My Quest Pass · AI Quest 60',
  '/wars': 'College Wars · AI Quest 60',
  '/leaders': 'Quest Leader Kit · AI Quest 60',
  '/whatsapp': 'WhatsApp Flow · AI Quest 60',
  '/hq': 'Growth Command Center · AI Quest 60',
  '/plan': 'Growth Plan · AI Quest 60',
  '/notes': 'AI + Learning Notes · AI Quest 60',
}

export default function App() {
  const route = useRoute()
  useEffect(() => {
    captureAttribution()
  }, [])
  useEffect(() => {
    document.title = TITLES[route] ?? TITLES['/']
  }, [route])
  const Page = ROUTES[route] ?? Landing
  return (
    <>
      <ReviewerBar />
      <Nav />
      <main>
        <Suspense
          fallback={
            <div className="section center">
              <span className="px-tag blink">Loading…</span>
            </div>
          }
        >
          <Page />
        </Suspense>
      </main>
      <Footer />
      <Toasts />
    </>
  )
}
