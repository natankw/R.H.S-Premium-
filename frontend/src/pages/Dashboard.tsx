import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts'
import { io } from 'socket.io-client'

interface DashboardStats {
  totalDevices: number
  onlineDevices: number
  offlineDevices: number
  groups: number
  activeAutomations: number
  totalLogs: number
}

interface DeviceStats {
  total: number
  online: number
  offline: number
  maintenance: number
  error: number
  totalRam: number
  totalStorage: number
  byGroup: Record<string, number>
}

export function Dashboard() {
  const { token, user } = useAuthStore()

  const { data: dashboardStats, isLoading: loadingDashboard } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get<DashboardStats>('/stats/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    enabled: !!token,
    refetchInterval: 30000
  })

  const { data: deviceStats, isLoading: loadingDevices } = useQuery({
    queryKey: ['device-stats'],
    queryFn: async () => {
      const response = await api.get<DeviceStats>('/stats/devices', {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    },
    enabled: !!token,
    refetchInterval: 30000
  })

  useEffect(() => {
    const socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:3001')
    
    socket.emit('subscribe', user?.id)

    socket.on('device:updated', () => {
      // Atualizar dados em tempo real
      window.location.reload()
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id])

  const COLORS = ['#7C3AED', '#10B981', '#EF4444', '#F59E0B', '#6B7280']

  if (loadingDashboard || loadingDevices) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Dispositivos"
          value={dashboardStats?.totalDevices || 0}
          icon="📱"
          color="#7C3AED"
        />
        <StatCard
          title="Dispositivos Online"
          value={dashboardStats?.onlineDevices || 0}
          icon="🟢"
          color="#10B981"
        />
        <StatCard
          title="Grupos"
          value={dashboardStats?.groups || 0}
          icon="📁"
          color="#F59E0B"
        />
        <StatCard
          title="Automações Ativas"
          value={dashboardStats?.activeAutomations || 0}
          icon="⚡"
          color="#7C3AED"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Device Status Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-glass backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Status dos Dispositivos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Online', value: deviceStats?.online || 0 },
                  { name: 'Offline', value: deviceStats?.offline || 0 },
                  { name: 'Manutenção', value: deviceStats?.maintenance || 0 },
                  { name: 'Erro', value: deviceStats?.error || 0 }
                ]}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {deviceStats && [
                  ...Array(4).keys()
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Group Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-glass backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Distribuição por Grupo</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={Object.entries(deviceStats?.byGroup || {}).map(([name, value]) => ({
                name,
                value
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem'
                }}
              />
              <Bar dataKey="value" fill="#7C3AED">
                {Object.entries(deviceStats?.byGroup || {}).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-glass backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Uso de RAM</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">
                {(deviceStats?.totalRam || 0).toFixed(1)} GB
              </p>
              <p className="text-gray-400 mt-2">Total de RAM disponível</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-glass backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Armazenamento</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">
                {(deviceStats?.totalStorage || 0).toFixed(1)} GB
              </p>
              <p className="text-gray-400 mt-2">Total de armazenamento</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-glass backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Logs</h3>
          <div className="flex items-center justify-center h-40">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">
                {dashboardStats?.totalLogs || 0}
              </p>
              <p className="text-gray-400 mt-2">Total de logs registrados</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-glass backdrop-blur-sm rounded-xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
          style={{ 
            background: `linear-gradient(135deg, ${color}33, ${color}11)`,
            boxShadow: `0 0 20px ${color}33`
          }}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  )
        }
