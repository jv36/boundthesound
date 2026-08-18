'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useIdentity } from '@/hooks/useIdentity'
import { useRoom } from '@/hooks/useRoom'
import { useSocket } from '@/hooks/useSocket'
import { RoomLobby } from '@/components/room/RoomLobby'
import { GameRoom } from '@/components/room/GameRoom'
import { Loader2 } from 'lucide-react'

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const { userId } = useIdentity()
  const router = useRouter()
  const socket = useSocket()
  const { room, setRoom, leaveRoom } = useRoom()

  // Auto-join the room once socket is ready
  useEffect(() => {
    if (!socket || !roomId || room) return

    // Try joining by ID — server looks up by room code stored in URL
    socket.emit('room:join', { code: roomId }, (res) => {
      if (res.room) setRoom(res.room)
      else router.push('/rooms')
    })

    return () => {
      leaveRoom()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, roomId])

  if (!socket) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-white/50">
        Connecting to room…
      </div>
    )
  }

  if (room.state === 'waiting') {
    return <RoomLobby room={room} currentUserId={userId} />
  }

  return <GameRoom room={room} currentUserId={userId} />
}
