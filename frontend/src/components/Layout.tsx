import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  LayoutDashboard, 
  Smartphone, 
  FolderTree, 
  Network, 
  Zap, 
  AppWindow, 
  FileText, 
  History, 
  Settings,
  LogOut
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'

const menuItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/devices', icon: Smartphone, label: 'Dispositivos' },
  { path: '/groups', icon: FolderTree, label: 'Grupos' },
  { path: '/proxies', icon: Network, label: 'Proxies' },
  { path: '/automation', icon: Zap, label: 'Automação' },
  { path: '/applications', icon: AppWindow, label: 'Aplicativos' },
  { path: '/files', icon: FileText, label: 'Arquivos' },
  { path: '/logs', icon: History, label: 'Logs' },
  { path: '/settings', icon: Settings, label: 'Configurações' },
]

export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-secondary">
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="w-72 bg-glass backdrop-blur-sm border-r border-white/10 flex flex-col"
      >
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light animate-neon-pulse">
            R.H.S PREMIUM
          </h1>
          <p className="text-sm text-gray-400 mt-1">Gerenciamento de Dispositivos</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="active-indicator"
                    className="ml-auto w-1 h-6 bg-primary rounded-full"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-4 py-3 bg-glass rounded-lg">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {user?.fullName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-white">{user?.fullName}</p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut size={18} className="text-gray-400" />
            </button>
          </div>
        </div>
      </motion.aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-glass backdrop-blur-sm border-b border-white/10 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Pesquisa global..."
                  className="w-full pl-10 pr-4 py-2 bg-glass backdrop-blur-sm border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
    }
