'use client'

import { Header } from '@/components/Header'
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  // Refresh handler for dashboard
  const handleRefresh = () => {
    // Trigger a soft refresh by reloading the current page data
    window.dispatchEvent(new Event('refresh-data'))
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Header onRefresh={pathname === '/dashboard' ? handleRefresh : undefined} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}

