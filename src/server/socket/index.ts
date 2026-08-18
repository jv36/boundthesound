import type { Server } from 'socket.io'

import { registerRoomHandlers } from './roomHandlers'
import { registerGameHandlers } from './gameHandlers'
import { roomManager } from '../rooms/RoomManager'
import { parseCookieHeader, USER_ID_COOKIE, NAME_COOKIE, defaultName } from '@/lib/cookies'

export function setupSocket(io: Server) {
  // Attach the guest identity (set by middleware.ts) to every socket
  io.use((socket, next) => {
    const cookies = parseCookieHeader(socket.request.headers.cookie)
    const id = cookies[USER_ID_COOKIE] ?? `guest_${socket.id}`
    const name = cookies[NAME_COOKIE] ?? defaultName(id)
    socket.data.user = { id, name, image: undefined }
    next()
  })

  io.on('connection', (socket) => {
    registerRoomHandlers(io, socket)
    registerGameHandlers(io, socket)

    socket.on('disconnect', () => {
      const room = roomManager.getRoomForSocket(socket.id)
      if (!room) return

      const { room: updated } = roomManager.removePlayer(room.id, socket.id)
      if (updated) {
        io.to(room.id).emit('room:updated', updated)
        io.to(room.id).emit('room:player-left', {
          playerId: socket.data.user.id,
          playerName: socket.data.user.name,
        })
      }
    })
  })
}
