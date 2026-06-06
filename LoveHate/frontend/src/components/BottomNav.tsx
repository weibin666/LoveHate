import { NavLink } from 'react-router-dom'

const navItems = [
  { to: '/', icon: '🏠', label: '首页' },
  { to: '/shop', icon: '🏪', label: '商店' },
  { to: '/chat', icon: '💬', label: '聊天' },
  { to: '/letters', icon: '✉️', label: '信箱' },
  { to: '/profile', icon: '👤', label: '我的' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-lg border-t border-gray-800 z-50">
      <div className="max-w-lg mx-auto flex">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-3 transition-colors ${
                isActive ? 'text-love' : 'text-gray-500 hover:text-gray-300'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs mt-1">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
