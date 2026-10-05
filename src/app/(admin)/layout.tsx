'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { adminNavItems } from '@/lib/constants'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.replace('/login')
      } else if (role !== 'admin') {
        router.replace('/dashboard')
      }
    }
  }, [loading, profile, role, router])

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-muted-foreground">Verifying admin credentials...</p>
        </div>
      </div>
    )
  }

  if (!profile || role !== 'admin') {
    return null
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar items={adminNavItems} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar navItems={adminNavItems} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
