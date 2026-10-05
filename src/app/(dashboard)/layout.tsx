'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { studentNavItems } from '@/lib/constants'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.replace('/login')
      } else if (role === 'admin') {
        router.replace('/admin')
      }
    }
  }, [loading, profile, role, router])

  const currentNavItems = useMemo(() => {
    return studentNavItems.filter((item) => item.roles.includes(role))
  }, [role])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (!profile || role === 'admin') {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={currentNavItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar navItems={currentNavItems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
