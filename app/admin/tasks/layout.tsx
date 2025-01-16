'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TASK_TABS = [
  { label: 'Resumen', href: '/admin/tasks' },
  { label: 'Tarea Actual', href: '/admin/tasks/current' },
  { label: 'Historial', href: '/admin/tasks/history' },
  { label: 'Reportes', href: '/admin/tasks/reports' }
]

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex space-x-8 px-6">
            {TASK_TABS.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${pathname === tab.href
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 