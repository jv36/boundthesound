'use client'
import { useState } from 'react'
import { useSocket } from '@/hooks/useSocket'
import type { Room } from '@/types/game'
import { PlayerList } from './PlayerList'
import { Copy, Check, Play } from 'lucide-react'

interface RoomLobbyProps {
  room: Room
  currentUserId: string
}

export function RoomLobby({ room, currentUserId }: RoomLobbyProps) {
  const socket = useSocket()
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const isHost = room.hostId === currentUserId

  function copyCode() {
    navigator.clipboard.writeText(room.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function startGame() {
    if (!socket) return
    setStarting(true)
    setError('')
    socket.emit('room:start', (res) => {
      if (res.error) {
        setError(res.error)
        setStarting(false)
      }
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 flex flex-col gap-8">
      {/* Room header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{room.name}</h1>
          <p className="text-white/50 mt-1">Waiting for players…</p>
        </div>
        <button
          onClick={copyCode}
          className="flex items-center gap-2 glass px-4 py-2 text-sm font-mono hover:bg-white/10 transition-colors"
          title="Copy room code"
        >
          <span className="text-green-400 tracking-widest font-bold">{room.code}</span>
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-white/40" />}
        </button>
      </div>

      {/* Settings summary */}
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { label: 'Rounds', value: room.settings.totalRounds },
          { label: 'Songs / round', value: room.settings.songsPerRound },
          { label: 'Guess time', value: `${room.settings.guessTimeSecs}s` },
        ].map(({ label, value }) => (
          <div key={label} className="glass py-3">
            <p className="text-xl font-bold text-green-400">{value}</p>
            <p className="text-xs text-white/50 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Players */}
      <PlayerList players={room.players} hostId={room.hostId} currentUserId={currentUserId} />

      {/* Modifiers */}
      {(room.settings.hideArtist || room.settings.hideSongTitle) && (
        <div className="glass p-3 text-sm text-yellow-400/80 border-yellow-500/20">
          🎭 Hard mode:{' '}
          {[
            room.settings.hideArtist && 'artists hidden',
            room.settings.hideSongTitle && 'titles hidden',
          ]
            .filter(Boolean)
            .join(' & ')}
        </div>
      )}
      {room.settings.sequentialReveal && (
        <div className="glass p-3 text-sm text-white/50 border-white/10">
          🔢 The picker reveals songs one by one instead of all at once
        </div>
      )}

      {/* Start button (host only) */}
      {isHost && (
        <div>
          <button
            onClick={startGame}
            className="btn-primary w-full py-3 text-base"
            disabled={room.players.length < 2 || starting}
          >
            <Play className="h-5 w-5" />
            {starting ? 'Starting…' : 'Start game'}
          </button>
          {room.players.length < 2 && (
            <p className="text-xs text-white/40 text-center mt-2">
              Need at least 2 players to start
            </p>
          )}
          {error && <p className="text-red-400 text-sm text-center mt-2">{error}</p>}
        </div>
      )}
    </div>
  )
}
