'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSocket } from '@/hooks/useSocket'
import type { RoomSummary } from '@/types/game'
import { Users, ArrowRight, Loader2 } from 'lucide-react'

export function RoomsBrowser() {
  const socket = useSocket()
  const router = useRouter()
  const [rooms, setRooms] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [joinCode, setJoinCode] = useState('')
  const [joinError, setJoinError] = useState('')

  useEffect(() => {
    if (!socket) return

    socket.emit('room:list', (res) => {
      setRooms(res.rooms)
      setLoading(false)
    })

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      socket.emit('room:list', (res) => setRooms(res.rooms))
    }, 5000)

    return () => clearInterval(interval)
  }, [socket])

  function joinByCode(e: React.FormEvent) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setJoinError('')
    router.push(`/rooms/${joinCode.trim().toUpperCase()}`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Join by code */}
      <div className="glass p-5">
        <h2 className="font-semibold mb-3">Join by code</h2>
        <form onSubmit={joinByCode} className="flex gap-2">
          <input
            className="input uppercase tracking-widest font-mono"
            placeholder="ABC123"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button type="submit" className="btn-primary">
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
        {joinError && <p className="text-red-400 text-sm mt-2">{joinError}</p>}
      </div>

      {/* Public rooms */}
      <div>
        <h2 className="font-semibold mb-3">Public rooms</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-white/30" />
          </div>
        ) : rooms.length === 0 ? (
          <p className="text-white/40 text-sm text-center py-12">
            No public rooms right now — create one!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => router.push(`/rooms/${room.code}`)}
                className="glass-hover p-4 flex items-center justify-between text-left"
              >
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-white/50 flex items-center gap-1 mt-0.5">
                    <Users className="h-3.5 w-3.5" />
                    {room.playerCount}/{room.maxPlayers} players
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="badge bg-white/10 text-white/60 font-mono">{room.code}</span>
                  <ArrowRight className="h-4 w-4 text-white/30" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
