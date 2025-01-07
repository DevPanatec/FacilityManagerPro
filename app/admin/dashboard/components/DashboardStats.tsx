'use client'

import { useEffect, useState } from 'react'
import { createClient } from '../../../utils/supabase/client'

interface Stats {
  totalUsers: number
  totalTasks: number
  activeProjects: number
  pendingRequests: number
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalTasks: 0,
    activeProjects: 0,
    pendingRequests: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()
      
      try {
        // Fetch users count
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        // Fetch tasks count
        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })

        // Fetch active projects
        const { count: projectsCount } = await supabase
          .from('projects')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        // Fetch pending requests
        const { count: requestsCount } = await supabase
          .from('requests')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')

        setStats({
          totalUsers: usersCount || 0,
          totalTasks: tasksCount || 0,
          activeProjects: projectsCount || 0,
          pendingRequests: requestsCount || 0
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return <div>Loading stats...</div>
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard title="Total Users" value={stats.totalUsers} />
      <StatCard title="Total Tasks" value={stats.totalTasks} />
      <StatCard title="Active Projects" value={stats.activeProjects} />
      <StatCard title="Pending Requests" value={stats.pendingRequests} />
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">
              {value}
            </dd>
          </div>
        </div>
      </div>
    </div>
  )
} 
