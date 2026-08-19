'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { LinkIcon, Music, Settings, Volume1, Volume2, VolumeX } from 'lucide-react'
import { useIdentity } from '@/hooks/useIdentity'
import { useAudioSettings } from '@/hooks/useAudioSettings'

export function Navbar() {
  const { name, setName } = useIdentity()
  const { volume, setVolume } = useAudioSettings()
  const [open, setOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState(name)
  const menuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => setNameDraft(name), [name])

  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function commitName() {
    const trimmed = nameDraft.trim()
    if (trimmed && trimmed !== name) setName(trimmed)
  }

  const VolumeIcon = getVolumeIcon(volume)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-surface-1/80 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
        <Link href="/rooms" className="flex items-center gap-2 font-bold text-lg">
          <LinkIcon className="h-5 w-5 text-white-500" />
          Linking Park
        </Link>

        <div ref={menuRef} className="relative flex items-center gap-2">
          <span className="text-sm text-white/70 hidden sm:block">{name}</span>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface-2 border border-white/10 rounded-xl shadow-xl p-4 flex flex-col gap-4 z-50">
              <div>
                <label className="block text-xs font-medium text-white/40 uppercase tracking-wide mb-1.5">
                  Display name
                </label>
                <input
                  className="input"
                  value={nameDraft}
                  maxLength={30}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={commitName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitName()
                    }
                  }}
                />
              </div>

              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 uppercase tracking-wide mb-1.5">
                  <VolumeIcon className="h-3.5 w-3.5" /> Preview volume
                </label>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full accent-green-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

function getVolumeIcon(volume: number) {
  if (volume === 0) return VolumeX
  if (volume < 0.5) return Volume1
  return Volume2
}
