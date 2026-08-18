'use client'
import type { Round, Player } from '@/types/game'
import { SongCard } from '@/components/game/SongCard'
import { PlayerList } from './PlayerList'
import { Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RoundResultsProps {
  round: Round
  players: Player[]
  currentUserId: string
  isHost: boolean
  onNextRound: () => void
  isLastRound: boolean
}

export function RoundResults({
  round,
  players,
  currentUserId,
  isHost,
  onNextRound,
  isLastRound,
}: RoundResultsProps) {
  const correctGuesses = round.guesses.filter((g) => g.isCorrect)

  return (
    <div className="flex flex-col gap-6 mx-auto max-w-2xl px-4 py-8">
      {/* Topic reveal */}
      <div className="glass p-6 text-center border-green-500/20">
        <p className="text-sm text-white/50 mb-1">The connection was</p>
        <p className="text-3xl font-bold text-green-400">{round.topic}</p>
      </div>

      {/* Songs */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs font-medium text-white/40 uppercase tracking-wide">Songs</p>
        {round.songs.map((song, i) => (
          <SongCard key={song.trackId} song={song} index={i} />
        ))}
      </div>

      {/* Correct guesses */}
      {correctGuesses.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide">Got it right</p>
          {correctGuesses.map((g, i) => (
            <div
              key={g.playerId}
              className="flex items-center gap-3 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20 text-sm"
            >
              <Trophy className={cn('h-4 w-4', i === 0 ? 'text-yellow-400' : 'text-green-400')} />
              <span className="font-medium">{g.playerName}</span>
              <span className="text-white/50 flex-1">{g.text}</span>
              <span className="text-green-400 font-bold">+{g.points}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scoreboard */}
      <PlayerList
        players={players}
        hostId=""
        currentUserId={currentUserId}
        showScore
      />

      {/* Host advances */}
      {isHost && (
        <button onClick={onNextRound} className="btn-primary py-3 text-base">
          {isLastRound ? 'See final results' : 'Next round →'}
        </button>
      )}

      {!isHost && (
        <p className="text-center text-sm text-white/40">Waiting for the host to continue…</p>
      )}
    </div>
  )
}
