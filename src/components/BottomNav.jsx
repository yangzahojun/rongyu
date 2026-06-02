import { useLocation, useNavigate } from 'react-router-dom'
import { House, Calendar, PencilSimple, MagnifyingGlass } from '@phosphor-icons/react'

const tabs = [
  { path: '/', icon: House, label: '首页' },
  { path: '/schedule', icon: Calendar, label: '课程表' },
  { path: '/diary', icon: PencilSimple, label: '写日记' },
  { path: '/search', icon: MagnifyingGlass, label: '搜索' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="bottom-nav" role="navigation" aria-label="主导航">
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path
        const Icon = tab.icon
        return (
          <button
            key={tab.path}
            className={`nav-item${isActive ? ' active' : ''}`}
            onClick={() => navigate(tab.path)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={22} weight={isActive ? 'fill' : 'regular'} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
