import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/providers/theme-provider'
import { Toaster } from 'sonner'
import { AmbientVisuals } from '@/components/effects/ambient-visuals'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'studEZ - Your Unified CampusOS',
  description: 'A modern campus management platform for students, teachers, and administrators.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AmbientVisuals />
          {children}
          <Toaster position="top-right" richColors closeButton />
        </ThemeProvider>
      </body>
    </html>
  )
}
