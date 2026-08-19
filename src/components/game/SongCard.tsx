import Image from 'next/image'
import { AudioPlayer } from './AudioPlayer'
import { cn } from '@/lib/utils'
import type { Song, MaskedSong } from '@/types/game'
import { EyeOff } from 'lucide-react'

type SongCardSong = Song | MaskedSong

interface SongCardProps {
  song: SongCardSong
  index?: number
  selectable?: boolean
  selected?: boolean
  onSelect?: () => void
  onRemove?: () => void
  className?: string
}

export function SongCard({
  song,
  index,
  selectable,
  selected,
  onSelect,
  onRemove,
  className,
}: SongCardProps) {
  return (
    <div
      onClick={selectable ? onSelect : undefined}
      className={cn(
        'flex items-center gap-4 p-3 rounded-xl border transition-all',
        selectable && 'cursor-pointer',
        selected
          ? 'bg-green-500/10 border-green-500/40'
          : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/20',
        className,
      )}
    >
      {/* Index badge */}
      {index !== undefined && (
        <span className="flex-none w-6 h-6 flex items-center justify-center rounded-full bg-white/10 text-xs font-mono text-white/50">
          {index + 1}
        </span>
      )}

      {/* Album art */}
      <div className="flex-none w-12 h-12 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
        {song.albumArt ? (
          <Image
            src={song.albumArt}
            alt={song.album ?? 'Album art'}
            width={48}
            height={48}
            className="object-cover w-full h-full"
          />
        ) : (
          <EyeOff className="h-4 w-4 text-white/20" />
        )}
      </div>

      {/* Metadata */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate', !song.title && 'italic text-white/30')}>
          {song.title ?? (
            <span className="flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> hidden
            </span>
          )}
        </p>
        <p className={cn('text-xs truncate mt-0.5', !song.artist ? 'italic text-white/30' : 'text-white/50')}>
          {song.artist ?? (
            <span className="flex items-center gap-1">
              <EyeOff className="h-3 w-3" /> hidden
            </span>
          )}
          {song.album && (
            <span className="text-white/30"> · {song.album}</span>
          )}
        </p>
      </div>

      {/* Audio */}
      <AudioPlayer previewUrl={song.previewUrl} className="flex-none" />

      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="flex-none p-1 rounded-lg text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs"
        >
          ✕
        </button>
      )}
    </div>
  )
}
