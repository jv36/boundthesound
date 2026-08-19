import { v4 as uuidv4 } from 'uuid'
import type { Room, Player, Song, Guess, Round, RoomSettings, RevealableField } from '@/types/game'

const DEFAULT_SETTINGS: RoomSettings = {
  maxPlayers: 8,
  totalRounds: 5,
  songsPerRound: 5,
  guessTimeSecs: 60,
  hideArtist: false,
  hideSongTitle: false,
  hideCoverArt: false,
  hideAlbumName: false,
  hidePreview: false,
  sequentialReveal: false,
  isPrivate: false,
}

class RoomManager {
  private rooms = new Map<string, Room>()
  private codeToId = new Map<string, string>()

  // ── Room lifecycle ────────────────────────────────────────────────────────

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code: string
    do {
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    } while (this.codeToId.has(code))
    return code
  }

  createRoom(
    hostId: string,
    hostSocketId: string,
    hostName: string,
    hostAvatar: string | undefined,
    options: { name: string } & Partial<RoomSettings>,
  ): Room {
    const { name, ...settingsOverride } = options
    const id = uuidv4()
    const code = this.generateCode()

    const room: Room = {
      id,
      code,
      name,
      hostId,
      players: [{ id: hostId, socketId: hostSocketId, name: hostName, avatarUrl: hostAvatar, score: 0, isHost: true }],
      settings: { ...DEFAULT_SETTINGS, ...settingsOverride },
      state: 'waiting',
      currentRound: 0,
      rounds: [],
      createdAt: Date.now(),
    }

    this.rooms.set(id, room)
    this.codeToId.set(code, id)
    return room
  }

  getRoomById(id: string): Room | undefined {
    return this.rooms.get(id)
  }

  getRoomByCode(code: string): Room | undefined {
    const id = this.codeToId.get(code.toUpperCase())
    return id ? this.rooms.get(id) : undefined
  }

  getPublicRooms(): Room[] {
    return Array.from(this.rooms.values()).filter((r) => !r.settings.isPrivate)
  }

  getRoomForSocket(socketId: string): Room | undefined {
    return Array.from(this.rooms.values()).find((r) => r.players.some((p) => p.socketId === socketId))
  }

  // ── Players ───────────────────────────────────────────────────────────────

  addPlayer(roomId: string, player: Omit<Player, 'score' | 'isHost'>): Room | null {
    const room = this.rooms.get(roomId)
    if (!room || room.players.length >= room.settings.maxPlayers) return null
    room.players.push({ ...player, score: 0, isHost: false })
    return room
  }

  removePlayer(
    roomId: string,
    socketId: string,
  ): { room: Room | null; wasHost: boolean; newHostId?: string } {
    const room = this.rooms.get(roomId)
    if (!room) return { room: null, wasHost: false }

    const idx = room.players.findIndex((p) => p.socketId === socketId)
    if (idx === -1) return { room, wasHost: false }

    const [player] = room.players.splice(idx, 1)

    if (room.players.length === 0) {
      this.rooms.delete(roomId)
      this.codeToId.delete(room.code)
      return { room: null, wasHost: player.isHost }
    }

    let newHostId: string | undefined
    if (player.isHost) {
      room.players[0].isHost = true
      room.hostId = room.players[0].id
      newHostId = room.players[0].id
    }

    return { room, wasHost: player.isHost, newHostId }
  }

  updatePlayerSocket(playerId: string, newSocketId: string): void {
    for (const room of Array.from(this.rooms.values())) {
      const player = room.players.find((p: Player) => p.id === playerId)
      if (player) {
        player.socketId = newSocketId
        return
      }
    }
  }

  // ── Game flow ─────────────────────────────────────────────────────────────

  startGame(roomId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room || room.state !== 'waiting' || room.players.length < 2) return null

    room.state = 'picking'
    room.currentRound = 0
    room.rounds = []
    this.pushNewRound(room)
    return room
  }

  private pushNewRound(room: Room): void {
    const pickerIndex = room.rounds.length % room.players.length
    const picker = room.players[pickerIndex]
    room.rounds.push({
      number: room.rounds.length + 1,
      pickerId: picker.id,
      songs: [],
      revealedCount: 0,
      revealedFields: [],
      topic: null,
      guesses: [],
      state: 'picking',
    })
  }

  submitSongs(roomId: string, pickerId: string, songs: Song[], topic: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const round = room.rounds[room.currentRound]
    if (!round || round.pickerId !== pickerId || round.state !== 'picking') return null

    round.songs = songs
    round.revealedCount = room.settings.sequentialReveal ? Math.min(1, songs.length) : songs.length
    round.revealedFields = songs.map(() => ({
      title: false,
      artist: false,
      album: false,
      albumArt: false,
      previewUrl: false,
    }))
    round.topic = topic
    round.state = 'guessing'
    round.startedAt = Date.now()
    room.state = 'guessing'
    return room
  }

  submitGuess(roomId: string, playerId: string, playerName: string, text: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room || room.state !== 'guessing') return null

    const round = room.rounds[room.currentRound]
    if (!round || round.state !== 'guessing') return null
    if (round.pickerId === playerId) return null

    // Multiple guesses per round are allowed, but a player can't guess again once
    // they've already gotten it right, and must wait for the picker to validate
    // their current guess before submitting another one.
    const playerGuesses = round.guesses.filter((g) => g.playerId === playerId)
    if (playerGuesses.some((g) => g.isCorrect === true)) return null
    if (playerGuesses.some((g) => g.isCorrect === undefined)) return null

    round.guesses.push({ playerId, playerName, text, timestamp: Date.now() })
    return room
  }

  revealNextSong(roomId: string, pickerId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const round = room.rounds[room.currentRound]
    if (!round || round.pickerId !== pickerId || round.state !== 'guessing') return null
    if (round.revealedCount >= round.songs.length) return null

    round.revealedCount++
    return room
  }

  revealField(roomId: string, pickerId: string, index: number, field: RevealableField): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const round = room.rounds[room.currentRound]
    if (!round || round.pickerId !== pickerId || round.state !== 'guessing') return null
    if (index < 0 || index >= round.songs.length) return null

    round.revealedFields[index] = { ...round.revealedFields[index], [field]: true }
    return room
  }

  validateGuess(
    roomId: string,
    guessPlayerId: string,
    isCorrect: boolean,
  ): { room: Room; points: number } | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const round = room.rounds[room.currentRound]
    if (!round || round.state !== 'guessing') return null

    const guess = round.guesses.find((g) => g.playerId === guessPlayerId && g.isCorrect === undefined)
    if (!guess) return null

    guess.isCorrect = isCorrect

    let points = 0
    if (isCorrect) {
      // Speed bonus: first correct answer overall = 50pts, second = 40, …, floor at 10
      const correctsSoFar = round.guesses.filter((g) => g.isCorrect === true).length
      const orderBonus = Math.max(10, 50 - (correctsSoFar - 1) * 10)

      // Accuracy penalty: every extra guess it took this player to get there costs
      // 10pts, so more guesses always means fewer points.
      const attempts = round.guesses.filter((g) => g.playerId === guessPlayerId).length
      const attemptPenalty = (attempts - 1) * 10

      points = Math.max(10, orderBonus - attemptPenalty)
      guess.points = points
      const player = room.players.find((p) => p.id === guessPlayerId)
      if (player) player.score += points
    }

    return { room, points }
  }

  endRound(roomId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    const round = room.rounds[room.currentRound]
    if (!round) return null

    round.state = 'results'
    room.state = 'round-results'
    return room
  }

  nextRound(roomId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.currentRound++

    if (room.currentRound >= room.settings.totalRounds) {
      room.state = 'game-over'
      return room
    }

    room.state = 'picking'
    this.pushNewRound(room)
    return room
  }

  resetRoom(roomId: string): Room | null {
    const room = this.rooms.get(roomId)
    if (!room) return null

    room.state = 'waiting'
    room.currentRound = 0
    room.rounds = []
    room.players.forEach((p) => (p.score = 0))
    return room
  }
}

export const roomManager = new RoomManager()
