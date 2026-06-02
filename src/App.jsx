import { HashRouter, Routes, Route } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import SchedulePage from './pages/SchedulePage'
import DiaryPage from './pages/DiaryPage'
import ShowcasePage from './pages/ShowcasePage'
import MemberProfile from './pages/MemberProfile'
import SearchPage from './pages/SearchPage'
import XiaoWan from './components/XiaoWan'

export default function App() {
  return (
    <HashRouter>
      <div className="app-container">
        <header className="header">
          <img src="xiaowan.png" alt="小弯" style={{ height: 34, marginRight: 6 }} />
          <span className="header-title">蓉育向阳</span>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/schedule" element={<SchedulePage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/member/:id" element={<MemberProfile />} />
          <Route path="/search" element={<SearchPage />} />
        </Routes>

        <BottomNav />
        <XiaoWan />
      </div>
    </HashRouter>
  )
}
