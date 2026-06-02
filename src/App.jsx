import { useEffect } from 'react'
import { HashRouter, Routes, Route, useParams } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import ErrorBoundary from './components/ErrorBoundary'
import HomePage from './pages/HomePage'
import SchedulePage from './pages/SchedulePage'
import DiaryPage from './pages/DiaryPage'
import ShowcasePage from './pages/ShowcasePage'
import MemberProfile from './pages/MemberProfile'
import SearchPage from './pages/SearchPage'
import XiaoWan from './components/XiaoWan'
import { startSync } from './outfitUtils'

function ProfileGuard() {
  const { id } = useParams()
  return (
    <ErrorBoundary resetKey={id}>
      <MemberProfile />
    </ErrorBoundary>
  )
}

export default function App() {
  // 全局启动共享同步（3秒轮询 Supabase）
  useEffect(() => { startSync(3000) }, [])

  return (
    <HashRouter>
      <div className="app-container">
        <header className="header">
          <img src="xiaowan.png" alt="小弯" style={{ height: 34, marginRight: 6 }} />
          <span className="header-title">蓉育向阳</span>
        </header>

        <Routes>
          <Route path="/" element={<ErrorBoundary><HomePage /></ErrorBoundary>} />
          <Route path="/schedule" element={<ErrorBoundary><SchedulePage /></ErrorBoundary>} />
          <Route path="/diary" element={<ErrorBoundary><DiaryPage /></ErrorBoundary>} />
          <Route path="/showcase" element={<ErrorBoundary><ShowcasePage /></ErrorBoundary>} />
          <Route path="/member/:id" element={<ProfileGuard />} />
          <Route path="/search" element={<ErrorBoundary><SearchPage /></ErrorBoundary>} />
        </Routes>

        <BottomNav />
        <XiaoWan />
      </div>
    </HashRouter>
  )
}
