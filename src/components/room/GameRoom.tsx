'use client'
import { useCallback } from 'react'
import { useSocket } from '@/hooks/useSocket'
import type { Room, RevealableField } from '@/types/game'
import { SongPicker } from './SongPicker'
import { GuessPanel } from './GuessPanel'
import { RoundResults } from './RoundResults'
import { PlayerList } from './PlayerList'
import { SongCard } from '@/components/game/SongCard'
import { Loader2, Music2, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GameRoomProps {
  room: Room
  currentUserId: string
}

// Room state is owned by the parent page (via useRoom) and passed as a prop.
// This component only reads from `room` and fires socket events.
export function GameRoom({ room: activeRoom, currentUserId }: GameRoomProps) {
  const socket = useSocket()

  const currentRound = activeRoom.rounds[activeRoom.currentRound]
  const isPicker = currentRound?.pickerId === currentUserId
  const isHost = activeRoom.hostId === currentUserId

  const pickSongs = useCallback(
    async (songs: any[], topic: string) => {
      return new Promise<void>((resolve, reject) => {
        socket?.emit('game:pick-songs', { songs, topic }, (res) => {
          if (res.error) reject(new Error(res.error))
          else resolve()
        })
      })
    },
    [socket],
  )

  function endRound() {
    socket?.emit('game:end-round', () => {})
  }

  function nextRound() {
    socket?.emit('game:next-round', () => {})
  }

  function revealNextSong() {
    socket?.emit('game:reveal-next-song', () => {})
  }

  function revealField(index: number, field: RevealableField) {
    socket?.emit('game:reveal-field', { index, field }, () => {})
  }

  // ── Game over ─────────────────────────────────────────────────────────────
  if (activeRoom.state === 'game-over') {
    const sorted = [...activeRoom.players].sort((a, b) => b.score - a.score)
    return (
      <div className="mx-auto max-w-lg px-4 py-16 flex flex-col items-center gap-6 text-center">
        <Trophy className="h-16 w-16 text-yellow-400" />
        <h1 className="text-4xl font-bold">Game Over!</h1>
        <p className="text-white/50">
          {sorted[0]?.name} wins with {sorted[0]?.score} points!
        </p>
        <PlayerList
          players={activeRoom.players}
          hostId={activeRoom.hostId}
          currentUserId={currentUserId}
          showScore
        />
      </div>
    )
  }

  // ── Round results ─────────────────────────────────────────────────────────
  if (activeRoom.state === 'round-results' && currentRound) {
    return (
      <RoundResults
        round={currentRound}
        players={activeRoom.players}
        currentUserId={currentUserId}
        isHost={isHost}
        onNextRound={nextRound}
        isLastRound={activeRoom.currentRound + 1 >= activeRoom.settings.totalRounds}
      />
    )
  }

  // ── Picker's song selection phase ─────────────────────────────────────────
  if (activeRoom.state === 'picking' && isPicker) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <RoundHeader room={activeRoom} />
        <div className="mt-6">
          <SongPicker maxSongs={activeRoom.settings.songsPerRound} onSubmit={pickSongs} />
        </div>
      </div>
    )
  }

  // ── Waiting for picker to choose songs ────────────────────────────────────
  if (activeRoom.state === 'picking' && !isPicker) {
    const pickerName = activeRoom.players.find((p) => p.id === currentRound?.pickerId)?.name ?? '…'
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <RoundHeader room={activeRoom} />
        <div className="flex flex-col items-center gap-3 py-16 text-white/50">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">{pickerName} is choosing songs…</p>
        </div>
        <PlayerList players={activeRoom.players} hostId={activeRoom.hostId} currentUserId={currentUserId} />
      </div>
    )
  }

  // ── Guessing phase ────────────────────────────────────────────────────────
  if (activeRoom.state === 'guessing' && currentRound) {
    const myGuesses = currentRound.guesses.filter((g) => g.playerId === currentUserId)
    let guessStatus: 'idle' | 'pending' | 'correct' = 'idle'
    if (myGuesses.some((g) => g.isCorrect === true)) guessStatus = 'correct'
    else if (myGuesses.some((g) => g.isCorrect === undefined)) guessStatus = 'pending'
    const revealedCount = currentRound.revealedCount ?? currentRound.songs.length
    const { hideArtist, hideSongTitle, hideCoverArt, hideAlbumName, hidePreview, sequentialReveal } =
      activeRoom.settings

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 flex flex-col gap-6">
        <RoundHeader room={activeRoom} />

        {/* Songs */}
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-medium text-white/40 uppercase tracking-wide">
            What do these songs have in common?
          </p>
          {currentRound.songs.length > 0 ? (
            currentRound.songs.map((song, i) => {
              const isRevealedToPlayers = i < revealedCount
              const fields = currentRound.revealedFields[i] ?? {
                title: false,
                artist: false,
                album: false,
                albumArt: false,
                previewUrl: false,
              }
              return (
                <div key={(song as any).trackId} className="flex flex-col gap-1">
                  <SongCard
                    song={song as any}
                    index={i}
                    className={isPicker && !isRevealedToPlayers ? 'opacity-50' : undefined}
                  />
                  {isPicker && (
                    <div className="flex items-center gap-3 pl-11 -mt-1 text-xs">
                      {!isRevealedToPlayers && (
                        <span className="text-white/30">Hidden from players</span>
                      )}
                      {isRevealedToPlayers && hideSongTitle && !fields.title && (
                        <button
                          onClick={() => revealField(i, 'title')}
                          className="text-green-400 hover:underline"
                        >
                          Reveal title
                        </button>
                      )}
                      {isRevealedToPlayers && hideArtist && !fields.artist && (
                        <button
                          onClick={() => revealField(i, 'artist')}
                          className="text-green-400 hover:underline"
                        >
                          Reveal artist
                        </button>
                      )}
                      {isRevealedToPlayers && hideCoverArt && !fields.albumArt && (
                        <button
                          onClick={() => revealField(i, 'albumArt')}
                          className="text-green-400 hover:underline"
                        >
                          Reveal cover
                        </button>
                      )}
                      {isRevealedToPlayers && hideAlbumName && !fields.album && (
                        <button
                          onClick={() => revealField(i, 'album')}
                          className="text-green-400 hover:underline"
                        >
                          Reveal album
                        </button>
                      )}
                      {isRevealedToPlayers && hidePreview && !fields.previewUrl && (
                        <button
                          onClick={() => revealField(i, 'previewUrl')}
                          className="text-green-400 hover:underline"
                        >
                          Reveal preview
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="flex items-center justify-center gap-2 py-8 text-white/30">
              <Music2 className="h-5 w-5" />
              <span className="text-sm">Waiting for songs…</span>
            </div>
          )}
          {isPicker && sequentialReveal && revealedCount < currentRound.songs.length && (
            <button onClick={revealNextSong} className="btn-secondary self-start mt-1">
              Reveal next song ({revealedCount}/{currentRound.songs.length})
            </button>
          )}
        </div>

        {/* Picker sees validation panel; guessers see guess input */}
        <GuessPanel
          guesses={currentRound.guesses}
          roomId={activeRoom.id}
          isPicker={isPicker}
          currentUserId={currentUserId}
          guessStatus={guessStatus}
          myGuessCount={myGuesses.length}
          disabled={currentRound.songs.length === 0}
        />

        {/* Picker can end the round */}
        {isPicker && (
          <button onClick={endRound} className="btn-secondary">
            End round & reveal answer
          </button>
        )}

        {/* Sidebar: scores */}
        <PlayerList
          players={activeRoom.players}
          hostId={activeRoom.hostId}
          currentUserId={currentUserId}
          showScore
        />
      </div>
    )
  }

  return null
}

function RoundHeader({ room }: { room: Room }) {
  const round = room.rounds[room.currentRound]
  const pickerName = room.players.find((p) => p.id === round?.pickerId)?.name ?? '?'
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-white/40 uppercase tracking-wide font-medium">
          Round {(room.currentRound ?? 0) + 1} / {room.settings.totalRounds}
        </p>
        <h2 className="text-xl font-bold mt-0.5">
          {round?.state === 'picking' ? `${pickerName} is picking…` : `Guess the theme!`}
        </h2>
      </div>
      <div className="badge bg-white/10 text-white/50 text-xs">
        {pickerName} picks
      </div>
    </div>
  )
}
