import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { roomManager } from '../rooms/RoomManager'
import type { RoomSettings } from '@/types/game'

const CreateRoomSchema = z.object({
  name: z.string().min(1).max(50).trim(),
  settings: z
    .object({
      maxPlayers: z.number().int().min(2).max(16).optional(),
      totalRounds: z.number().int().min(1).max(20).optional(),
      songsPerRound: z.number().int().min(3).max(5).optional(),
      guessTimeSecs: z.number().int().min(10).max(300).optional(),
      hideArtist: z.boolean().optional(),
      hideSongTitle: z.boolean().optional(),
      sequentialReveal: z.boolean().optional(),
      isPrivate: z.boolean().optional(),
      password: z.string().max(50).optional(),
    })
    .optional(),
})

const JoinRoomSchema = z.object({
  code: z.string().length(6).toUpperCase(),
  password: z.string().optional(),
})

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on('room:list', (callback: Function) => {
    const rooms = roomManager.getPublicRooms().map((r) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      playerCount: r.players.length,
      maxPlayers: r.settings.maxPlayers,
      state: r.state,
    }))
    callback({ rooms })
  })

  socket.on('room:create', (data: unknown, callback: Function) => {
    const parsed = CreateRoomSchema.safeParse(data)
    if (!parsed.success) return callback({ error: 'Invalid input' })

    const { name, settings } = parsed.data
    const { user } = socket.data

    const room = roomManager.createRoom(user.id, socket.id, user.name, user.image, {
      name,
      ...(settings as Partial<RoomSettings>),
    })

    socket.join(room.id)
    callback({ room })
  })

  socket.on('room:join', (data: unknown, callback: Function) => {
    const parsed = JoinRoomSchema.safeParse(data)
    if (!parsed.success) return callback({ error: 'Invalid input' })

    const { code, password } = parsed.data
    const room = roomManager.getRoomByCode(code)

    if (!room) return callback({ error: 'Room not found' })
    if (room.state !== 'waiting') return callback({ error: 'Game already in progress' })
    if (room.settings.isPrivate && room.settings.password !== password)
      return callback({ error: 'Wrong password' })
    if (room.players.length >= room.settings.maxPlayers) return callback({ error: 'Room is full' })

    const { user } = socket.data

    // Reconnecting player
    const existing = room.players.find((p) => p.id === user.id)
    if (existing) {
      existing.socketId = socket.id
      socket.join(room.id)
      return callback({ room })
    }

    const updated = roomManager.addPlayer(room.id, {
      id: user.id,
      socketId: socket.id,
      name: user.name,
      avatarUrl: user.image,
    })

    if (!updated) return callback({ error: 'Could not join room' })

    socket.join(room.id)
    socket.to(room.id).emit('room:player-joined', {
      player: updated.players.find((p) => p.id === user.id)!,
    })
    io.to(room.id).emit('room:updated', updated)
    callback({ room: updated })
  })

  socket.on('room:leave', () => {
    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return

    const { room: updated } = roomManager.removePlayer(room.id, socket.id)
    socket.leave(room.id)

    if (updated) {
      io.to(room.id).emit('room:updated', updated)
      io.to(room.id).emit('room:player-left', {
        playerId: socket.data.user.id,
        playerName: socket.data.user.name,
      })
    }
  })

  socket.on('room:start', (callback: Function) => {
    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return callback?.({ error: 'Not in a room' })
    if (room.hostId !== socket.data.user.id) return callback?.({ error: 'Only the host can start' })
    if (room.players.length < 2) return callback?.({ error: 'Need at least 2 players' })

    const updated = roomManager.startGame(room.id)
    if (!updated) return callback?.({ error: 'Could not start game' })

    const round = updated.rounds[updated.currentRound]
    io.to(room.id).emit('room:updated', updated)
    io.to(room.id).emit('game:round-started', {
      roundNumber: round.number,
      totalRounds: updated.settings.totalRounds,
      pickerId: round.pickerId,
      pickerName: updated.players.find((p) => p.id === round.pickerId)?.name ?? 'Unknown',
    })

    callback?.({})
  })
}
