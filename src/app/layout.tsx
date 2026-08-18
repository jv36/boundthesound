import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Navbar } from '@/components/navbar'
import { getIdentity } from '@/lib/identity'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BoundTheSound',
  description: 'Real-time multiplayer music guessing game',
  openGraph: {
    title: 'BoundTheSound',
    description: 'Can you find the common theme between these songs?',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const identity = getIdentity()

  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers identity={identity}>
          <Navbar />
          <main className="min-h-screen">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
