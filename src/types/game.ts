// ── Shared game types (used by both client and server) ────────────────────────

export interface Song {
  trackId: string
  title: string
  artist: string
  album: string
  albumArt: string
  previewUrl: string | null
  externalUrl: string
}

/** Song as presented to guessers (fields can be hidden per settings) */
export interface MaskedSong {
  trackId: string
  title: string | null      // null when hideSongTitle
  artist: string | null     // null when hideArtist
  album: string | null      // null when hideAlbumName
  albumArt: string | null   // null when hideCoverArt
  previewUrl: string | null // null when no preview available, or hidePreview
  externalUrl: string
}

export interface Player {
  id: string
  socketId: string
  name: string
  avatarUrl?: string
  score: number
  isHost: boolean
}

export interface Guess {
  playerId: string
  playerName: string
  text: string
  isCorrect?: boolean   // undefined = awaiting picker validation
  points?: number
  timestamp: number
}

/** Any song field the picker can manually reveal to guessers ahead of the room-wide setting */
export type RevealableField = 'title' | 'artist' | 'album' | 'albumArt' | 'previewUrl'

/** Per-song manual reveal of masked fields (only meaningful when the matching hide* setting is on) */
export type RevealedFields = Record<RevealableField, boolean>

export interface Round {
  number: number
  pickerId: string
  songs: Array<Song | MaskedSong>
  /** How many of `songs` are currently visible to guessers (sequential reveal) */
  revealedCount: number
  /** Per-song title/artist reveal overrides, parallel to `songs` */
  revealedFields: RevealedFields[]
  /** null during 'picking' phase so picker can set it privately */
  topic: string | null
  guesses: Guess[]
  state: 'picking' | 'guessing' | 'results'
  startedAt?: number
}

export interface RoomSettings {
  maxPlayers: number
  totalRounds: number
  songsPerRound: number
  guessTimeSecs: number
  hideArtist: boolean
  hideSongTitle: boolean
  /** Hide the album cover art from guessers */
  hideCoverArt: boolean
  /** Hide the album name from guessers */
  hideAlbumName: boolean
  /** Hide the audio preview player from guessers */
  hidePreview: boolean
  /** Picker reveals songs to guessers one at a time instead of all at once */
  sequentialReveal: boolean
  isPrivate: boolean
  password?: string
}

export interface Room {
  id: string
  code: string
  name: string
  hostId: string
  players: Player[]
  settings: RoomSettings
  state: 'waiting' | 'picking' | 'guessing' | 'round-results' | 'game-over'
  currentRound: number
  rounds: Round[]
  createdAt: number
}

/** Lightweight room summary shown in the public lobby */
export interface RoomSummary {
  id: string
  code: string
  name: string
  playerCount: number
  maxPlayers: number
  state: Room['state']
}

// ── Socket.io event payloads ──────────────────────────────────────────────────

export interface ServerToClientEvents {
  'room:updated': (room: Room) => void
  'room:player-joined': (data: { player: Player }) => void
  'room:player-left': (data: { playerId: string; playerName: string }) => void
  'game:round-started': (data: {
    roundNumber: number
    totalRounds: number
    pickerId: string
    pickerName: string
  }) => void
  'game:songs-revealed': (data: { songs: MaskedSong[]; roundNumber: number }) => void
  'game:guess-added': (data: { guess: Omit<Guess, 'isCorrect' | 'points'> }) => void
  'game:guess-validated': (data: {
    guessPlayerId: string
    isCorrect: boolean
    points: number
    players: Pick<Player, 'id' | 'name' | 'score'>[]
  }) => void
  'game:round-ended': (data: {
    roundNumber: number
    topic: string
    songs: Array<Song | MaskedSong>
    guesses: Guess[]
    players: Pick<Player, 'id' | 'name' | 'score'>[]
  }) => void
  'game:over': (data: { players: Pick<Player, 'id' | 'name' | 'score'>[] }) => void
}

export interface ClientToServerEvents {
  'room:list': (callback: (res: { rooms: RoomSummary[] }) => void) => void
  'room:create': (
    data: { name: string; settings?: Partial<RoomSettings> },
    callback: (res: { room?: Room; error?: string }) => void,
  ) => void
  'room:join': (
    data: { code: string; password?: string },
    callback: (res: { room?: Room; error?: string }) => void,
  ) => void
  'room:leave': () => void
  'room:start': (callback: (res: { error?: string }) => void) => void
  'game:pick-songs': (
    data: { songs: Song[]; topic: string },
    callback: (res: { error?: string }) => void,
  ) => void
  'game:guess': (
    data: { text: string },
    callback: (res: { error?: string }) => void,
  ) => void
  'game:validate': (
    data: { guessPlayerId: string; isCorrect: boolean },
    callback: (res: { error?: string; points?: number }) => void,
  ) => void
  'game:end-round': (callback: (res: { error?: string }) => void) => void
  'game:next-round': (callback: (res: { error?: string }) => void) => void
  'game:reveal-next-song': (callback: (res: { error?: string }) => void) => void
  'game:reveal-field': (
    data: { index: number; field: RevealableField },
    callback: (res: { error?: string }) => void,
  ) => void
}
