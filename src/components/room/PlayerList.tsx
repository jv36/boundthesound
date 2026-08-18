import Image from 'next/image'
import type { Player } from '@/types/game'
import { Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlayerListProps {
  players: Player[]
  hostId: string
  currentUserId: string
  showScore?: boolean
}

export function PlayerList({ players, hostId, currentUserId, showScore }: PlayerListProps) {
  const sorted = showScore ? [...players].sort((a, b) => b.score - a.score) : players

  return (
    <div className="glass p-4 flex flex-col gap-1">
      <p className="text-xs font-medium text-white/40 uppercase tracking-wide mb-2">
        Players ({players.length})
      </p>
      {sorted.map((player, rank) => (
        <div
          key={player.id}
          className={cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg',
            player.id === currentUserId ? 'bg-white/5' : '',
          )}
        >
          {showScore && (
            <span className="w-6 text-center text-sm font-mono text-white/40">
              {rank + 1}
            </span>
          )}
          <div className="relative flex-none">
            {player.avatarUrl ? (
              <Image
                src={player.avatarUrl}
                alt={player.name}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium">
                {player.name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          <span className="flex-1 text-sm font-medium">
            {player.name}
            {player.id === currentUserId && (
              <span className="text-white/40 font-normal"> (you)</span>
            )}
          </span>

          {player.id === hostId && (
            <Crown className="h-3.5 w-3.5 text-yellow-400" aria-label="Host" />
          )}

          {showScore && (
            <span className="text-sm font-bold text-green-400">{player.score} pts</span>
          )}
        </div>
      ))}
    </div>
  )
}
