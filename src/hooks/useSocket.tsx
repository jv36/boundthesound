'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { ServerToClientEvents, ClientToServerEvents } from '@/types/game'

type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>

const SocketContext = createContext<GameSocket | null>(null)

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<GameSocket | null>(null)

  useEffect(() => {
    const s: GameSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    })
    setSocket(s)
    return () => {
      s.disconnect()
    }
  }, [])

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
}

export function useSocket(): GameSocket | null {
  return useContext(SocketContext)
}
