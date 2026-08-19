'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAudioSettings } from '@/hooks/useAudioSettings'
import { notifyPlaying, notifyStopped } from '@/lib/audioManager'

interface AudioPlayerProps {
  previewUrl: string | null
  className?: string
}

export function AudioPlayer({ previewUrl, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')
  const { volume } = useAudioSettings()

  // Stable identity for this player instance, used to register/unregister with the
  // single-preview-at-a-time coordinator.
  const stop = useCallback(() => {
    audioRef.current?.pause()
    setState('paused')
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  // Stop and release audio when this card is unmounted (e.g. the round changes) so
  // previews never keep playing in the background.
  useEffect(() => {
    return () => {
      notifyStopped(stop)
      audioRef.current?.pause()
      audioRef.current = null
    }
  }, [stop])

  const toggle = useCallback(() => {
    if (!previewUrl) return

    if (!audioRef.current) {
      const audio = new Audio(previewUrl)
      audio.volume = volume
      audio.onended = () => {
        setState('idle')
        notifyStopped(stop)
      }
      audio.oncanplay = () => {
        notifyPlaying(stop)
        audio.play()
        setState('playing')
      }
      audioRef.current = audio
      setState('loading')
    } else if (state === 'playing') {
      audioRef.current.pause()
      setState('paused')
      notifyStopped(stop)
    } else {
      notifyPlaying(stop)
      audioRef.current.play()
      setState('playing')
    }
  }, [previewUrl, state, volume, stop])

  if (!previewUrl) {
    return (
      <button disabled className={cn('p-2 rounded-full bg-white/5 text-white/20 cursor-not-allowed', className)}>
        <Play className="h-4 w-4" />
      </button>
    )
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        'p-2 rounded-full transition-all',
        state === 'playing'
          ? 'bg-green-500 text-black hover:bg-green-400 animate-pulse-glow'
          : 'bg-white/10 text-white hover:bg-white/20',
        className,
      )}
      title={state === 'playing' ? 'Pause preview' : 'Play 30s preview'}
    >
      <PlayerIcon state={state} />
    </button>
  )
}

function PlayerIcon({ state }: { state: 'idle' | 'loading' | 'playing' | 'paused' }) {
  if (state === 'loading') return <Loader2 className="h-4 w-4 animate-spin" />
  if (state === 'playing') return <Pause className="h-4 w-4" />
  return <Play className="h-4 w-4" />
}
