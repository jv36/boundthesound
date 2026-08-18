'use client'
import { useCallback, useEffect, useState } from 'react'
import { useSocket } from './useSocket'
import type { Room, RoomSettings } from '@/types/game'

export function useRoom() {
  const socket = useSocket()
  const [room, setRoom] = useState<Room | null>(null)

  useEffect(() => {
    if (!socket) return

    socket.on('room:updated', setRoom)

    return () => {
      socket.off('room:updated', setRoom)
    }
  }, [socket])

  const createRoom = useCallback(
    (name: string, settings?: Partial<RoomSettings>): Promise<Room> =>
      new Promise((resolve, reject) => {
        if (!socket) return reject(new Error('Not connected'))
        socket.emit('room:create', { name, settings }, (res) => {
          if (res.error || !res.room) return reject(new Error(res.error ?? 'Unknown error'))
          setRoom(res.room)
          resolve(res.room)
        })
      }),
    [socket],
  )

  const joinRoom = useCallback(
    (code: string, password?: string): Promise<Room> =>
      new Promise((resolve, reject) => {
        if (!socket) return reject(new Error('Not connected'))
        socket.emit('room:join', { code, password }, (res) => {
          if (res.error || !res.room) return reject(new Error(res.error ?? 'Unknown error'))
          setRoom(res.room)
          resolve(res.room)
        })
      }),
    [socket],
  )

  const leaveRoom = useCallback(() => {
    socket?.emit('room:leave')
    setRoom(null)
  }, [socket])

  const startGame = useCallback(
    (): Promise<void> =>
      new Promise((resolve, reject) => {
        if (!socket) return reject(new Error('Not connected'))
        socket.emit('room:start', (res) => {
          if (res.error) reject(new Error(res.error))
          else resolve()
        })
      }),
    [socket],
  )

  return { room, setRoom, createRoom, joinRoom, leaveRoom, startGame }
}
