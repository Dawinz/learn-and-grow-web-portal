import type { Metadata } from 'next'
import './globals.css'
import { ToastProvider } from '@/lib/toast'

export const metadata: Metadata = {
  title: 'EARNVERSE - Learn Skills, Earn Rewards',
  description: 'Learn new skills, earn XP, and convert your earnings into cash. Multiple learning paths and earning opportunities.',
  icons: {
    icon: '/icon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}

