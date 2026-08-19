'use client'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'bts:preview-volume'
const DEFAULT_VOLUME = 0.7

interface AudioSettingsContextValue {
  volume: number
  setVolume: (volume: number) => void
}

const AudioSettingsContext = createContext<AudioSettingsContextValue | null>(null)

export function AudioSettingsProvider({ children }: { children: React.ReactNode }) {
  const [volume, setVolumeState] = useState(DEFAULT_VOLUME)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null
    if (stored !== null) {
      const parsed = Number(stored)
      if (!Number.isNaN(parsed)) setVolumeState(Math.min(1, Math.max(0, parsed)))
    }
  }, [])

  function setVolume(next: number) {
    const clamped = Math.min(1, Math.max(0, next))
    setVolumeState(clamped)
    window.localStorage.setItem(STORAGE_KEY, String(clamped))
  }

  const value = useMemo(() => ({ volume, setVolume }), [volume])

  return <AudioSettingsContext.Provider value={value}>{children}</AudioSettingsContext.Provider>
}

export function useAudioSettings(): AudioSettingsContextValue {
  const ctx = useContext(AudioSettingsContext)
  if (!ctx) throw new Error('useAudioSettings must be used within AudioSettingsProvider')
  return ctx
}
