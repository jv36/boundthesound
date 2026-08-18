'use client'
import { useRef, useState, useCallback } from 'react'
import { Play, Pause, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  previewUrl: string | null
  className?: string
}

export function AudioPlayer({ previewUrl, className }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'playing' | 'paused'>('idle')

  const toggle = useCallback(() => {
    if (!previewUrl) return

    if (!audioRef.current) {
      const audio = new Audio(previewUrl)
      audio.onended = () => setState('idle')
      audio.oncanplay = () => {
        audio.play()
        setState('playing')
      }
      audioRef.current = audio
      setState('loading')
    } else if (state === 'playing') {
      audioRef.current.pause()
      setState('paused')
    } else {
      audioRef.current.play()
      setState('playing')
    }
  }, [previewUrl, state])

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
      {state === 'loading' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === 'playing' ? (
        <Pause className="h-4 w-4" />
      ) : (
        <Play className="h-4 w-4" />
      )}
    </button>
  )
}
