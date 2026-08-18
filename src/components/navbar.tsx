'use client'
import Link from 'next/link'
import { Music2, Pencil } from 'lucide-react'
import { useIdentity } from '@/hooks/useIdentity'

export function Navbar() {
  const { name, setName } = useIdentity()

  function rename() {
    const next = window.prompt('Choose a display name', name)
    if (next && next.trim()) setName(next.trim())
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-surface-1/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/rooms" className="flex items-center gap-2 font-bold text-lg">
          <Music2 className="h-5 w-5 text-green-500" />
          BoundTheSound
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-white/70 hidden sm:block">{name}</span>
          <button
            onClick={rename}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Change name"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
