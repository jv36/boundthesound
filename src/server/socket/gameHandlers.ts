import type { Server, Socket } from 'socket.io'
import { z } from 'zod'
import { roomManager } from '../rooms/RoomManager'
import type { MaskedSong, Room, RoomSettings, Round, Song } from '@/types/game'

const SongSchema = z.object({
  trackId: z.string(),
  title: z.string().min(1),
  artist: z.string().min(1),
  album: z.string(),
  albumArt: z.string().url(),
  previewUrl: z.string().url().nullable(),
  externalUrl: z.string().url(),
})

const PickSongsSchema = z.object({
  songs: z.array(SongSchema).min(3).max(5),
  topic: z.string().min(1).max(100).trim(),
})

function maskSongs(songs: Song[], hideArtist: boolean, hideSongTitle: boolean): MaskedSong[] {
  return songs.map((s) => ({
    ...s,
    title: hideSongTitle ? null : s.title,
    artist: hideArtist ? null : s.artist,
  }))
}

// Builds what guessers should currently see for a round: only the revealed songs, and with
// title/artist masked unless the picker has manually revealed that field for that song.
function guesserSongs(round: Round, settings: RoomSettings): Array<Song | MaskedSong> {
  return round.songs.slice(0, round.revealedCount).map((song, i) => {
    const revealed = round.revealedFields[i] ?? { title: false, artist: false }
    return {
      ...song,
      title: settings.hideSongTitle && !revealed.title ? null : song.title,
      artist: settings.hideArtist && !revealed.artist ? null : song.artist,
    }
  })
}

// Broadcasts room state to everyone, keeping the current round's topic hidden — and songs
// masked/limited to what's been revealed — from non-pickers while the round is still in
// progress. Every game action must go through this so guesses, validations, reveals, etc.
// actually reach clients — they only re-render off `room:updated`.
function broadcastRoomUpdate(io: Server, room: Room): void {
  const round = room.rounds[room.currentRound]
  const inProgress = round && (round.state === 'picking' || round.state === 'guessing')

  if (!inProgress) {
    io.to(room.id).emit('room:updated', room)
    return
  }

  const pickerSocketId = room.players.find((p) => p.id === round.pickerId)?.socketId
  const guesserRound: Round = { ...round, topic: null, songs: guesserSongs(round, room.settings) }
  const guesserRoom: Room = {
    ...room,
    rounds: room.rounds.map((r, i) => (i === room.currentRound ? guesserRound : r)),
  }

  if (pickerSocketId) {
    io.to(pickerSocketId).emit('room:updated', room)
    io.to(room.id).except(pickerSocketId).emit('room:updated', guesserRoom)
  } else {
    io.to(room.id).emit('room:updated', guesserRoom)
  }
}

export function registerGameHandlers(io: Server, socket: Socket) {
  // Picker submits their songs + topic, starting the guessing phase
  socket.on('game:pick-songs', (data: unknown, callback: Function) => {
    const parsed = PickSongsSchema.safeParse(data)
    if (!parsed.success) return callback?.({ error: 'Invalid input' })

    const { songs, topic } = parsed.data
    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return callback?.({ error: 'Not in a room' })

    const round = room.rounds[room.currentRound]
    if (!round || round.pickerId !== socket.data.user.id)
      return callback?.({ error: 'You are not the picker this round' })

    const updated = roomManager.submitSongs(room.id, socket.data.user.id, songs as Song[], topic)
    if (!updated) return callback?.({ error: 'Could not submit songs' })

    const currentRound = updated.rounds[updated.currentRound]
    const { hideArtist, hideSongTitle } = updated.settings

    broadcastRoomUpdate(io, updated)

    io.to(room.id).emit('game:songs-revealed', {
      roundNumber: currentRound.number,
      songs: maskSongs(songs as Song[], hideArtist, hideSongTitle),
    })

    callback?.({})
  })

  // Any non-picker player submits a guess
  socket.on('game:guess', (data: { text?: string }, callback: Function) => {
    if (!data?.text?.trim()) return callback?.({ error: 'Empty guess' })

    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return callback?.({ error: 'Not in a room' })

    const round = room.rounds[room.currentRound]
    if (!round || round.state !== 'guessing') return callback?.({ error: 'Not in guessing phase' })
    if (round.pickerId === socket.data.user.id) return callback?.({ error: 'Picker cannot guess' })

    const updated = roomManager.submitGuess(
      room.id,
      socket.data.user.id,
      socket.data.user.name,
      data.text.trim(),
    )

    if (!updated) return callback?.({ error: 'Already guessed this round' })

    const latestGuess = updated.rounds[updated.currentRound].guesses.slice(-1)[0]

    broadcastRoomUpdate(io, updated)

    io.to(room.id).emit('game:guess-added', {
      guess: {
        playerId: latestGuess.playerId,
        playerName: latestGuess.playerName,
        text: latestGuess.text,
        timestamp: latestGuess.timestamp,
      },
    })

    callback?.({})
  })

  // Picker marks a guess as correct or incorrect
  socket.on(
    'game:validate',
    (data: { guessPlayerId?: string; isCorrect?: boolean }, callback: Function) => {
      if (!data?.guessPlayerId || data.isCorrect === undefined)
        return callback?.({ error: 'Missing fields' })

      const room = roomManager.getRoomForSocket(socket.id)
      if (!room) return callback?.({ error: 'Not in a room' })

      const round = room.rounds[room.currentRound]
      if (round?.pickerId !== socket.data.user.id)
        return callback?.({ error: 'Only the picker can validate' })

      const result = roomManager.validateGuess(room.id, data.guessPlayerId, data.isCorrect)
      if (!result) return callback?.({ error: 'Could not validate guess' })

      const { room: updated, points } = result

      broadcastRoomUpdate(io, updated)

      io.to(room.id).emit('game:guess-validated', {
        guessPlayerId: data.guessPlayerId,
        isCorrect: data.isCorrect,
        points,
        players: updated.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
      })

      callback?.({ points })
    },
  )

  // Picker reveals the next song in sequential-reveal rooms
  socket.on('game:reveal-next-song', (callback: Function) => {
    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return callback?.({ error: 'Not in a room' })

    const round = room.rounds[room.currentRound]
    if (round?.pickerId !== socket.data.user.id)
      return callback?.({ error: 'Only the picker can reveal songs' })

    const updated = roomManager.revealNextSong(room.id, socket.data.user.id)
    if (!updated) return callback?.({ error: 'No more songs to reveal' })

    broadcastRoomUpdate(io, updated)
    callback?.({})
  })

  // Picker manually reveals a hidden title/artist for one song, as a hint
  socket.on(
    'game:reveal-field',
    (data: { index?: number; field?: 'title' | 'artist' }, callback: Function) => {
      if (data?.index === undefined || !data.field) return callback?.({ error: 'Missing fields' })

      const room = roomManager.getRoomForSocket(socket.id)
      if (!room) return callback?.({ error: 'Not in a room' })

      const round = room.rounds[room.currentRound]
      if (round?.pickerId !== socket.data.user.id)
        return callback?.({ error: 'Only the picker can reveal song details' })

      const updated = roomManager.revealField(room.id, socket.data.user.id, data.index, data.field)
      if (!updated) return callback?.({ error: 'Could not reveal field' })

      broadcastRoomUpdate(io, updated)
      callback?.({})
    },
  )

  // Picker decides the round is over (can also be triggered by timer on client)
  socket.on('game:end-round', (callback: Function) => {
    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return callback?.({ error: 'Not in a room' })

    const round = room.rounds[room.currentRound]
    if (round?.pickerId !== socket.data.user.id)
      return callback?.({ error: 'Only the picker can end the round' })

    const updated = roomManager.endRound(room.id)
    if (!updated) return callback?.({ error: 'Could not end round' })

    const endedRound = updated.rounds[updated.currentRound]
    io.to(room.id).emit('room:updated', updated)
    io.to(room.id).emit('game:round-ended', {
      roundNumber: endedRound.number,
      topic: endedRound.topic!,
      songs: endedRound.songs,
      guesses: endedRound.guesses,
      players: updated.players.map((p) => ({ id: p.id, name: p.name, score: p.score })),
    })

    callback?.({})
  })

  // Host advances to the next round (or ends the game)
  socket.on('game:next-round', (callback: Function) => {
    const room = roomManager.getRoomForSocket(socket.id)
    if (!room) return callback?.({ error: 'Not in a room' })
    if (room.hostId !== socket.data.user.id) return callback?.({ error: 'Only the host can advance' })

    const updated = roomManager.nextRound(room.id)
    if (!updated) return callback?.({ error: 'Could not advance' })

    io.to(room.id).emit('room:updated', updated)

    if (updated.state === 'game-over') {
      io.to(room.id).emit('game:over', {
        players: [...updated.players].sort((a, b) => b.score - a.score),
      })
    } else {
      const round = updated.rounds[updated.currentRound]
      io.to(room.id).emit('game:round-started', {
        roundNumber: round.number,
        totalRounds: updated.settings.totalRounds,
        pickerId: round.pickerId,
        pickerName: updated.players.find((p) => p.id === round.pickerId)?.name ?? 'Unknown',
      })
    }

    callback?.({})
  })
}
